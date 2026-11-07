"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "@/lib/zod";
import { normalizeClaimCode, CLAIM_CODE_PATTERN } from "@/lib/claim-code";
import { createCustomerSession, destroyCustomerSession, getCustomer } from "@/lib/customer-session";
import { db, DbError } from "@/lib/db";
import { getClientIp } from "@/lib/ip";
import {
  hashPassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  verifyPassword,
  DUMMY_PASSWORD_HASH,
} from "@/lib/password";
import type { AdminActionState } from "@/lib/public-types";
import { hitCustomRateLimit, hitRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { normalizeWaNumber, WA_NUMBER_PATTERN } from "@/lib/wa-number";

// ---------------------------------------------------------------------------
// Helper (konvensi sama dengan app/admin/actions.ts)
// ---------------------------------------------------------------------------

const ok = (message: string, details?: string[]): AdminActionState => ({ ok: true, message, details });
const fail = (message: string, details?: string[]): AdminActionState => ({ ok: false, message, details });

function formObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of formData.entries()) if (typeof value === "string") result[key] = value;
  return result;
}

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Data tidak valid.";
}

function refreshAccount() {
  revalidatePath("/akun", "layout");
}

async function clientIp(): Promise<string> {
  return getClientIp(await headers());
}

/** Tujuan redirect setelah masuk; hanya path internal yang diterima. */
function safeNext(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/akun";
  return raw;
}

const waSchema = z
  .string({ error: "Nomor WhatsApp wajib diisi." })
  .trim()
  .transform(normalizeWaNumber)
  .refine((value) => WA_NUMBER_PATTERN.test(value), {
    error: "Nomor WhatsApp tidak valid. Contoh: 0812-3456-7890.",
  });

const passwordSchema = z
  .string({ error: "Password wajib diisi." })
  .min(PASSWORD_MIN_LENGTH, { error: `Password minimal ${PASSWORD_MIN_LENGTH} karakter.` })
  .max(PASSWORD_MAX_LENGTH, { error: `Password maksimal ${PASSWORD_MAX_LENGTH} karakter.` });

const namaSchema = z
  .string({ error: "Nama wajib diisi." })
  .trim()
  .min(2, { error: "Nama minimal 2 karakter." })
  .max(100, { error: "Nama maksimal 100 karakter." });

const registerSchema = z
  .object({
    wa_number: waSchema,
    nama: namaSchema,
    password: passwordSchema,
    password_konfirmasi: z.string({ error: "Ulangi password Anda." }),
    next: z.string().optional(),
  })
  .refine((data) => data.password === data.password_konfirmasi, {
    error: "Password dan ulangi password tidak sama.",
    path: ["password_konfirmasi"],
  });

const loginSchema = z.object({
  wa_number: waSchema,
  password: z.string({ error: "Password wajib diisi." }),
  next: z.string().optional(),
});

const claimSchema = z.object({
  kode: z
    .string({ error: "Kode klaim wajib diisi." })
    .transform(normalizeClaimCode)
    .refine((value) => CLAIM_CODE_PATTERN.test(value), {
      error: "Format kode klaim tidak sesuai. Contoh: K7M2P-9XQ4T.",
    }),
});

// ---------------------------------------------------------------------------
// Daftar & masuk
// ---------------------------------------------------------------------------

export async function registerCustomerAction(formData: FormData): Promise<AdminActionState> {
  const ip = await clientIp();
  if (!(await hitRateLimit("customerRegister", ip))) return fail(RATE_LIMIT_MESSAGE);

  const parsed = registerSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { wa_number, nama, password } = parsed.data;

  const repo = db();
  try {
    if (await repo.getCustomerByWa(wa_number)) {
      return fail("Nomor WhatsApp ini sudah terdaftar. Silakan masuk, atau hubungi admin kalau lupa password.");
    }
    const customer = await repo.createCustomer({
      wa_number,
      nama,
      password_hash: await hashPassword(password),
    });
    await createCustomerSession(customer);
  } catch (error) {
    if (error instanceof DbError && error.code === "DUPLICATE") {
      return fail("Nomor WhatsApp ini sudah terdaftar. Silakan masuk.");
    }
    console.error("[akun] gagal mendaftar", error);
    return fail("Pendaftaran gagal. Silakan coba lagi beberapa saat lagi.");
  }

  refreshAccount();
  redirect(safeNext(parsed.data.next));
}

export async function loginCustomerAction(formData: FormData): Promise<AdminActionState> {
  const ip = await clientIp();
  if (!(await hitRateLimit("customerLogin", ip))) return fail(RATE_LIMIT_MESSAGE);

  const parsed = loginSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { wa_number, password } = parsed.data;

  const salah = fail("Nomor WhatsApp atau password salah.");
  const repo = db();

  let customer;
  try {
    customer = await repo.getCustomerByWa(wa_number);
  } catch (error) {
    console.error("[akun] gagal membaca akun", error);
    return fail("Server sedang sibuk. Silakan coba lagi.");
  }

  // Nomor tak dikenal tetap menjalankan verifikasi agar lama responsnya sama.
  if (!customer) {
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    return salah;
  }
  // Batas kedua, per akun, supaya satu akun tidak bisa digempur dari banyak IP.
  if (!(await hitCustomRateLimit(`customer-login:${customer.id}`, 10, 900))) return fail(RATE_LIMIT_MESSAGE);
  if (customer.is_blocked) return fail("Akun ini sedang dinonaktifkan. Hubungi admin lewat WhatsApp.");
  if (!(await verifyPassword(password, customer.password_hash))) return salah;

  try {
    await repo.updateCustomer(customer.id, { last_login_at: new Date().toISOString() });
  } catch (error) {
    console.error("[akun] gagal mencatat login", error);
  }
  await createCustomerSession(customer);

  refreshAccount();
  redirect(safeNext(parsed.data.next));
}

export async function logoutCustomerAction(): Promise<void> {
  await destroyCustomerSession();
  redirect("/");
}

// ---------------------------------------------------------------------------
// Klaim pesanan
// ---------------------------------------------------------------------------

export async function claimOrderAction(formData: FormData): Promise<AdminActionState> {
  const customer = await getCustomer();
  if (!customer) return fail("Sesi Anda berakhir. Silakan masuk lagi.");

  const ip = await clientIp();
  if (!(await hitRateLimit("claim", ip))) return fail(RATE_LIMIT_MESSAGE);
  if (!(await hitCustomRateLimit(`claim:${customer.id}`, 10, 3600))) return fail(RATE_LIMIT_MESSAGE);

  const parsed = claimSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  try {
    const order = await db().claimOrder(parsed.data.kode, customer.id);
    refreshAccount();
    return ok(`Pesanan ${order.shopee_order_no} berhasil ditambahkan ke akun Anda.`);
  } catch (error) {
    if (error instanceof DbError) {
      if (error.code === "CLAIM_CODE_INVALID") {
        return fail("Kode klaim tidak dikenali. Periksa lagi, atau minta kode baru ke admin.");
      }
      if (error.code === "CLAIM_CODE_EXPIRED") {
        return fail("Kode klaim sudah kedaluwarsa. Minta kode baru lewat WhatsApp.");
      }
      if (error.code === "ALREADY_CLAIMED") {
        return fail("Pesanan ini sudah terdaftar di akun lain. Hubungi admin kalau ini pesanan Anda.");
      }
    }
    console.error("[akun] gagal klaim", error);
    return fail("Klaim gagal diproses. Silakan coba lagi beberapa saat lagi.");
  }
}

// ---------------------------------------------------------------------------
// Pengaturan akun
// ---------------------------------------------------------------------------

const changePasswordSchema = z
  .object({
    password_lama: z.string({ error: "Password lama wajib diisi." }),
    password_baru: passwordSchema,
    password_konfirmasi: z.string({ error: "Ulangi password baru." }),
  })
  .refine((data) => data.password_baru === data.password_konfirmasi, {
    error: "Password baru dan ulangi password tidak sama.",
    path: ["password_konfirmasi"],
  });

export async function changePasswordAction(formData: FormData): Promise<AdminActionState> {
  const customer = await getCustomer();
  if (!customer) return fail("Sesi Anda berakhir. Silakan masuk lagi.");

  const parsed = changePasswordSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  if (!(await verifyPassword(parsed.data.password_lama, customer.password_hash))) {
    return fail("Password lama salah.");
  }

  try {
    const repo = db();
    await repo.updateCustomer(customer.id, {
      password_hash: await hashPassword(parsed.data.password_baru),
      // Menaikkan versi sesi membuat perangkat lain otomatis keluar.
      session_version: customer.session_version + 1,
    });
    const fresh = await repo.getCustomer(customer.id);
    if (fresh) await createCustomerSession(fresh);
  } catch (error) {
    console.error("[akun] gagal ganti password", error);
    return fail("Password gagal diganti. Silakan coba lagi.");
  }

  refreshAccount();
  return ok("Password berhasil diganti. Perangkat lain otomatis keluar dari akun.");
}
