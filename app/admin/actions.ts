"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "@/lib/zod";
import { cacheKeys, invalidate } from "@/lib/cache";
import { db, DbError } from "@/lib/db";
import { getAdminPassword } from "@/lib/env";
import { endOfJakartaDay, formatDateTime, maskSecret } from "@/lib/format";
import { getClientIp } from "@/lib/ip";
import { customerPath } from "@/lib/links";
import { orderNoSchema } from "@/lib/order-no";
import type { AdminActionState } from "@/lib/public-types";
import { hitRateLimit } from "@/lib/rate-limit";
import { checkAdminPassword, createAdminSession, destroyAdminSession, isAdmin } from "@/lib/session";
import {
  PROXY_CREDENTIAL_PATTERN,
  updateProxyCredentials,
  validateApiKey,
  WebshareError,
  type ApiKeyInfo,
} from "@/lib/webshare";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const ok = (message: string, details?: string[]): AdminActionState => ({ ok: true, message, details });
const fail = (message: string, details?: string[]): AdminActionState => ({ ok: false, message, details });

async function guard(): Promise<AdminActionState | null> {
  return (await isAdmin()) ? null : fail("Sesi admin berakhir. Silakan login ulang.");
}

function refreshAdmin() {
  revalidatePath("/admin", "layout");
}

function formObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of formData.entries()) if (typeof value === "string") result[key] = value;
  return result;
}

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Data tidak valid.";
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Maksimal ${max} karakter.` })
    .optional()
    .transform((value) => (value ? value : null));

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((value) => (value ? value : null))
  .pipe(z.email({ error: "Format email tidak valid." }).nullable());

const apiKeySchema = z
  .string({ error: "API key wajib diisi." })
  .trim()
  .min(10, { error: "API key terlalu pendek." })
  .max(200, { error: "API key terlalu panjang." })
  .regex(/^\S+$/, { error: "API key tidak boleh mengandung spasi." });

const dateInputSchema = z
  .string({ error: "Tanggal expired wajib diisi." })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Tanggal expired tidak valid." })
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00+07:00`).getTime()), {
    error: "Tanggal expired tidak valid.",
  });

const quotaSchema = z.coerce
  .number({ error: "Kuota harus berupa angka." })
  .int({ error: "Kuota harus bilangan bulat." })
  .min(0, { error: "Kuota minimal 0." })
  .max(10_000, { error: "Kuota terlalu besar." });

function describeUpstream(error: unknown): string {
  if (error instanceof WebshareError) {
    if (error.kind === "auth") return "API key ditolak (tidak valid atau sudah dicabut).";
    return `Validasi gagal [${error.kind}${error.status ? ` ${error.status}` : ""}]: ${error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}

function describeDb(error: unknown, duplicateMessage = "Data sudah ada."): string {
  if (error instanceof DbError) {
    if (error.code === "DUPLICATE") return duplicateMessage;
    if (error.code === "ACCOUNT_NOT_AVAILABLE") return "Akun tidak tersedia (mungkin sudah dipakai pesanan lain).";
    if (error.code === "ORDER_NOT_FOUND") return "Pesanan tidak ditemukan.";
  }
  console.error("[admin]", error);
  return "Terjadi kesalahan database. Cek log server.";
}

function planSummary(info: ApiKeyInfo): string[] {
  const { plan } = info;
  const type = [plan.proxy_type, plan.proxy_subtype].filter(Boolean).join(" / ") || "-";
  return [
    `Email: ${info.email ?? "-"}`,
    `Plan: ${type} · ${plan.proxy_count ?? "?"} proxy · bandwidth ${
      plan.bandwidth_limit > 0 ? `${plan.bandwidth_limit} GB` : "Unlimited"
    }`,
  ];
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export async function loginAction(formData: FormData): Promise<AdminActionState> {
  const ip = getClientIp(await headers());
  if (!(await hitRateLimit("login", ip))) return fail("Terlalu banyak percobaan login. Coba lagi dalam 5 menit.");
  if (!getAdminPassword()) return fail("ADMIN_PASSWORD belum di-set di environment variables.");

  const password = formData.get("password");
  if (typeof password !== "string" || !checkAdminPassword(password)) return fail("Password salah.");

  await createAdminSession();
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Pool akun
// ---------------------------------------------------------------------------

const labelSchema = z
  .string({ error: "Label wajib diisi." })
  .trim()
  .min(1, { error: "Label wajib diisi." })
  .max(100, { error: "Label maksimal 100 karakter." });

const newAccountSchema = z.object({
  label: labelSchema,
  api_key: apiKeySchema,
  email: optionalEmail,
  catatan: optionalText(1000),
});

export async function addAccountAction(formData: FormData): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = newAccountSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const input = parsed.data;

  const repo = db();
  if (await repo.findAccountByApiKey(input.api_key)) return fail("API key ini sudah ada di pool.");

  let info: ApiKeyInfo;
  try {
    info = await validateApiKey(input.api_key);
  } catch (error) {
    return fail(describeUpstream(error));
  }

  try {
    await repo.createAccount({ ...input, email: input.email ?? info.email });
  } catch (error) {
    return fail(describeDb(error, "API key ini sudah ada di pool."));
  }
  refreshAdmin();
  return ok(`Akun "${input.label}" tersimpan.`, planSummary(info));
}

const MAX_BULK = 30;

export async function bulkImportAccountsAction(formData: FormData): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const raw = formData.get("api_keys");
  const keys = [
    ...new Set(
      (typeof raw === "string" ? raw : "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  ];
  if (keys.length === 0) return fail("Masukkan minimal satu API key (satu per baris).");
  if (keys.length > MAX_BULK) return fail(`Maksimal ${MAX_BULK} API key per import.`);

  const repo = db();
  const details: string[] = new Array(keys.length);
  let success = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < keys.length) {
      const index = cursor++;
      const key = keys[index];
      const label = maskSecret(key);
      const shape = apiKeySchema.safeParse(key);
      if (!shape.success) {
        details[index] = `✗ ${label} — ${firstIssue(shape.error)}`;
        continue;
      }
      if (await repo.findAccountByApiKey(key)) {
        details[index] = `– ${label} — sudah ada di pool, dilewati`;
        continue;
      }
      try {
        const info = await validateApiKey(key);
        await repo.createAccount({
          label: info.email ?? `Akun ${key.slice(-4)}`,
          email: info.email,
          api_key: key,
          catatan: null,
        });
        success++;
        details[index] = `✓ ${label} — ${planSummary(info).join(" · ")}`;
      } catch (error) {
        details[index] = `✗ ${label} — ${error instanceof DbError ? describeDb(error, "duplikat") : describeUpstream(error)}`;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(5, keys.length) }, worker));
  refreshAdmin();
  const message = `${success} dari ${keys.length} akun berhasil diimport.`;
  return success > 0 ? ok(message, details) : fail(message, details);
}

const updateAccountSchema = z.object({
  label: labelSchema,
  api_key: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null))
    .pipe(apiKeySchema.nullable()),
  email: optionalEmail,
  catatan: optionalText(1000),
});

export async function updateAccountAction(accountId: string, formData: FormData): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = updateAccountSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { label, api_key, email, catatan } = parsed.data;

  const repo = db();
  const account = await repo.getAccount(accountId);
  if (!account) return fail("Akun tidak ditemukan.");

  const patch: Parameters<typeof repo.updateAccount>[1] = { label, email, catatan };
  let details: string[] | undefined;

  if (api_key && api_key !== account.api_key) {
    const other = await repo.findAccountByApiKey(api_key);
    if (other && other.id !== accountId) return fail("API key ini sudah dipakai akun lain.");
    try {
      const info = await validateApiKey(api_key);
      details = planSummary(info);
      patch.api_key = api_key;
      patch.email = email ?? info.email;
    } catch (error) {
      return fail(describeUpstream(error));
    }
  }

  try {
    await repo.updateAccount(accountId, patch);
  } catch (error) {
    return fail(describeDb(error, "API key ini sudah dipakai akun lain."));
  }
  if (patch.api_key) {
    await Promise.all(
      [cacheKeys.proxies, cacheKeys.countries, cacheKeys.bandwidth].map((key) => invalidate(key(accountId))),
    );
  }
  refreshAdmin();
  return ok("Akun diperbarui.", details);
}

export async function checkAccountAction(accountId: string): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;
  const repo = db();
  const account = await repo.getAccount(accountId);
  if (!account) return fail("Akun tidak ditemukan.");
  try {
    const info = await validateApiKey(account.api_key);
    if (!account.email && info.email) await repo.updateAccount(accountId, { email: info.email });
    refreshAdmin();
    return ok("API key valid.", planSummary(info));
  } catch (error) {
    return fail(describeUpstream(error));
  }
}

export async function toggleAccountDisabledAction(accountId: string): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;
  const repo = db();
  const account = await repo.getAccount(accountId);
  if (!account) return fail("Akun tidak ditemukan.");
  if (account.status === "assigned") return fail("Akun sedang tertaut ke pesanan. Lepas akun dari pesanan terlebih dahulu.");

  const next = account.status === "disabled" ? "available" : "disabled";
  await repo.updateAccount(accountId, { status: next });
  refreshAdmin();
  return ok(next === "disabled" ? "Akun dinonaktifkan." : "Akun diaktifkan kembali (available).");
}

export async function deleteAccountAction(accountId: string): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;
  const repo = db();
  const account = await repo.getAccount(accountId);
  if (!account) return fail("Akun tidak ditemukan.");

  const linked = account.status === "assigned" || (await repo.listOrders()).some((o) => o.account_id === accountId);
  if (linked) return fail("Akun masih tertaut ke pesanan dan tidak bisa dihapus.");

  try {
    await repo.deleteAccount(accountId);
  } catch (error) {
    return fail(describeDb(error));
  }
  refreshAdmin();
  return ok(`Akun "${account.label}" dihapus.`);
}

// ---------------------------------------------------------------------------
// Pesanan
// ---------------------------------------------------------------------------

const createOrderSchema = z.object({
  shopee_order_no: orderNoSchema,
  nama_customer: optionalText(100),
  account_id: z.string({ error: "Pilih akun." }).min(1, { error: "Pilih akun yang tersedia." }),
  expires_date: dateInputSchema,
  replace_quota: quotaSchema,
  catatan: optionalText(2000),
});

export async function createOrderAction(formData: FormData): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = createOrderSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const input = parsed.data;

  try {
    const order = await db().createOrder({
      shopee_order_no: input.shopee_order_no,
      account_id: input.account_id,
      nama_customer: input.nama_customer,
      expires_at: endOfJakartaDay(input.expires_date),
      replace_quota: input.replace_quota,
      catatan: input.catatan,
    });
    refreshAdmin();
    return ok(`Pesanan ${order.shopee_order_no} dibuat.`, [
      `Expired: ${formatDateTime(order.expires_at)}`,
      `Halaman customer: ${customerPath(order.shopee_order_no)}`,
    ]);
  } catch (error) {
    return fail(describeDb(error, "Nomor pesanan sudah terdaftar."));
  }
}

const updateOrderSchema = z.object({
  shopee_order_no: orderNoSchema,
  nama_customer: optionalText(100),
  expires_date: dateInputSchema,
  replace_quota: quotaSchema,
  replace_used: quotaSchema,
  catatan: optionalText(4000),
});

export async function updateOrderAction(orderId: string, formData: FormData): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = updateOrderSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const input = parsed.data;

  try {
    const repo = db();
    const current = await repo.getOrder(orderId);
    if (!current) return fail("Pesanan tidak ditemukan.");

    // Jika tanggal tidak diubah, pertahankan jam expired yang lama.
    const sameDate =
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date(current.expires_at)) ===
      input.expires_date;

    await repo.updateOrder(orderId, {
      shopee_order_no: input.shopee_order_no,
      nama_customer: input.nama_customer,
      expires_at: sameDate ? current.expires_at : endOfJakartaDay(input.expires_date),
      replace_quota: input.replace_quota,
      replace_used: input.replace_used,
      catatan: input.catatan,
    });
  } catch (error) {
    return fail(describeDb(error, "Nomor pesanan sudah dipakai pesanan lain."));
  }
  refreshAdmin();
  return ok("Pesanan diperbarui.");
}

export async function resetReplaceUsedAction(orderId: string): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;
  try {
    await db().updateOrder(orderId, { replace_used: 0 });
  } catch (error) {
    return fail(describeDb(error));
  }
  refreshAdmin();
  return ok("Pemakaian replace direset ke 0.");
}

const extendSchema = z.object({
  days: z.coerce
    .number({ error: "Jumlah hari harus angka." })
    .int({ error: "Jumlah hari harus bilangan bulat." })
    .min(1, { error: "Minimal 1 hari." })
    .max(3650, { error: "Maksimal 3650 hari." }),
  new_order_no: z
    .string()
    .optional()
    .transform((value) => (value && value.trim() ? value : null))
    .pipe(orderNoSchema.nullable()),
});

export async function extendOrderAction(orderId: string, formData: FormData): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = extendSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  try {
    const order = await db().extendOrder(orderId, parsed.data.days, parsed.data.new_order_no);
    refreshAdmin();
    return ok(`Diperpanjang ${parsed.data.days} hari.`, [
      `Expired baru: ${formatDateTime(order.expires_at)}`,
      `Nomor pesanan: ${order.shopee_order_no}`,
    ]);
  } catch (error) {
    return fail(describeDb(error, "Nomor pesanan baru sudah dipakai pesanan lain."));
  }
}

export async function linkOrderAccountAction(orderId: string, formData: FormData): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;
  const accountId = formData.get("account_id");
  if (typeof accountId !== "string" || !accountId) return fail("Pilih akun yang tersedia.");
  try {
    await db().setOrderAccount(orderId, accountId);
  } catch (error) {
    return fail(describeDb(error));
  }
  refreshAdmin();
  return ok("Akun ditautkan ke pesanan.");
}

export async function releaseOrderAccountAction(orderId: string): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;
  try {
    await db().setOrderAccount(orderId, null);
  } catch (error) {
    return fail(describeDb(error));
  }
  refreshAdmin();
  return ok("Akun dilepas dan kembali berstatus available.");
}

const proxyCredentialSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => value === undefined || PROXY_CREDENTIAL_PATTERN.test(value), {
    error: "Gunakan 8–32 karakter huruf/angka tanpa spasi.",
  });

const credentialsSchema = z
  .object({ username: proxyCredentialSchema, password: proxyCredentialSchema })
  .refine((value) => Boolean(value.username || value.password), {
    error: "Isi username baru, password baru, atau keduanya.",
  });

/** Ganti username/password proxy pada akun yang tertaut ke pesanan ini. */
export async function updateOrderCredentialsAction(orderId: string, formData: FormData): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = credentialsSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const repo = db();
  const order = await repo.getOrder(orderId);
  if (!order) return fail("Pesanan tidak ditemukan.");
  if (!order.account_id) return fail("Pesanan belum memiliki akun.");
  const account = await repo.getAccount(order.account_id);
  if (!account) return fail("Akun tidak ditemukan.");

  try {
    const config = await updateProxyCredentials(account.api_key, parsed.data);
    await invalidate(cacheKeys.proxies(account.id));
    refreshAdmin();
    return ok("Username & password proxy diganti.", [
      `Username: ${config.username}`,
      `Password: ${config.password}`,
      "Customer wajib memperbarui aplikasinya dengan kredensial baru.",
    ]);
  } catch (error) {
    return fail(describeUpstream(error));
  }
}

export async function toggleOrderActiveAction(orderId: string): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;
  const repo = db();
  const order = await repo.getOrder(orderId);
  if (!order) return fail("Pesanan tidak ditemukan.");
  await repo.updateOrder(orderId, { is_active: !order.is_active });
  refreshAdmin();
  return ok(order.is_active ? "Pesanan dinonaktifkan." : "Pesanan diaktifkan kembali.");
}
