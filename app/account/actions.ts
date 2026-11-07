"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
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
import { findMetode } from "@/lib/payment";
import { hitCustomRateLimit, hitRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import {
  INVOICE_TTL_JAM,
  kabariDiscord,
  MAKS_INVOICE_AKTIF,
  paketUntukInvoice,
} from "@/lib/services/invoice";
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
  return error.issues[0]?.message ?? "Invalid data.";
}

function refreshAccount() {
  revalidatePath("/account", "layout");
}

async function clientIp(): Promise<string> {
  return getClientIp(await headers());
}

/** Tujuan redirect setelah masuk; hanya path internal yang diterima. */
function safeNext(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/account";
  return raw;
}

const waSchema = z
  .string({ error: "WhatsApp number is required." })
  .trim()
  .transform(normalizeWaNumber)
  .refine((value) => WA_NUMBER_PATTERN.test(value), {
    error: "Invalid WhatsApp number. Example: 0812-3456-7890.",
  });

const passwordSchema = z
  .string({ error: "Password is required." })
  .min(PASSWORD_MIN_LENGTH, { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` })
  .max(PASSWORD_MAX_LENGTH, { error: `Password must be at most ${PASSWORD_MAX_LENGTH} characters.` });

const namaSchema = z
  .string({ error: "Name is required." })
  .trim()
  .min(2, { error: "Name must be at least 2 characters." })
  .max(100, { error: "Name must be at most 100 characters." });

const registerSchema = z
  .object({
    wa_number: waSchema,
    nama: namaSchema,
    password: passwordSchema,
    password_konfirmasi: z.string({ error: "Please confirm your password." }),
    next: z.string().optional(),
  })
  .refine((data) => data.password === data.password_konfirmasi, {
    error: "Password and confirmation do not match.",
    path: ["password_konfirmasi"],
  });

const loginSchema = z.object({
  wa_number: waSchema,
  password: z.string({ error: "Password is required." }),
  next: z.string().optional(),
});

const claimSchema = z.object({
  kode: z
    .string({ error: "Claim code is required." })
    .transform(normalizeClaimCode)
    .refine((value) => CLAIM_CODE_PATTERN.test(value), {
      error: "Invalid claim code format. Example: K7M2P-9XQ4T.",
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
      return fail("This WhatsApp number is already registered. Please log in, or contact us if you forgot your password.");
    }
    const customer = await repo.createCustomer({
      wa_number,
      nama,
      password_hash: await hashPassword(password),
    });
    await createCustomerSession(customer);
  } catch (error) {
    if (error instanceof DbError && error.code === "DUPLICATE") {
      return fail("This WhatsApp number is already registered. Please log in.");
    }
    console.error("[akun] gagal mendaftar", error);
    return fail("Registration failed. Please try again in a moment.");
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

  const salah = fail("Incorrect WhatsApp number or password.");
  const repo = db();

  let customer;
  try {
    customer = await repo.getCustomerByWa(wa_number);
  } catch (error) {
    console.error("[akun] gagal membaca akun", error);
    return fail("The server is busy. Please try again.");
  }

  // Nomor tak dikenal tetap menjalankan verifikasi agar lama responsnya sama.
  if (!customer) {
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    return salah;
  }
  // Batas kedua, per akun, supaya satu akun tidak bisa digempur dari banyak IP.
  if (!(await hitCustomRateLimit(`customer-login:${customer.id}`, 10, 900))) return fail(RATE_LIMIT_MESSAGE);
  if (customer.is_blocked) return fail("This account is currently disabled. Contact us on WhatsApp.");
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
  if (!customer) return fail("Your session has expired. Please log in again.");

  const ip = await clientIp();
  if (!(await hitRateLimit("claim", ip))) return fail(RATE_LIMIT_MESSAGE);
  if (!(await hitCustomRateLimit(`claim:${customer.id}`, 10, 3600))) return fail(RATE_LIMIT_MESSAGE);

  const parsed = claimSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  try {
    const order = await db().claimOrder(parsed.data.kode, customer.id);
    refreshAccount();
    return ok(`Order ${order.shopee_order_no} was added to your account.`);
  } catch (error) {
    if (error instanceof DbError) {
      if (error.code === "CLAIM_CODE_INVALID") {
        return fail("Claim code not recognized. Check it again, or request a new code from us.");
      }
      if (error.code === "CLAIM_CODE_EXPIRED") {
        return fail("This claim code has expired. Request a new one on WhatsApp.");
      }
      if (error.code === "ALREADY_CLAIMED") {
        return fail("This order is already registered to another account. Contact us if it's yours.");
      }
    }
    console.error("[akun] gagal klaim", error);
    return fail("Could not process the claim. Please try again in a moment.");
  }
}

// ---------------------------------------------------------------------------
// Pengaturan akun
// ---------------------------------------------------------------------------

const changePasswordSchema = z
  .object({
    password_lama: z.string({ error: "Current password is required." }),
    password_baru: passwordSchema,
    password_konfirmasi: z.string({ error: "Please confirm your new password." }),
  })
  .refine((data) => data.password_baru === data.password_konfirmasi, {
    error: "New password and confirmation do not match.",
    path: ["password_konfirmasi"],
  });

export async function changePasswordAction(formData: FormData): Promise<AdminActionState> {
  const customer = await getCustomer();
  if (!customer) return fail("Your session has expired. Please log in again.");

  const parsed = changePasswordSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  if (!(await verifyPassword(parsed.data.password_lama, customer.password_hash))) {
    return fail("Current password is incorrect.");
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
    return fail("Could not change your password. Please try again.");
  }

  refreshAccount();
  return ok("Password changed. Other devices have been signed out automatically.");
}

// ---------------------------------------------------------------------------
// Checkout: invoice pembayaran manual
// ---------------------------------------------------------------------------

const catatanSchema = z
  .string()
  .trim()
  .max(300, { error: "Note can be at most 300 characters." })
  .optional()
  .transform((value) => (value ? value : null));

const createInvoiceSchema = z.object({
  sku: z.string({ error: "Please choose a plan." }).trim().min(1, { error: "Please choose a plan." }),
  metode: z.string({ error: "Please choose a payment method." }).trim().min(1, { error: "Please choose a payment method." }),
  extend_order_id: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
  catatan: catatanSchema,
});

const invoiceNoSchema = z
  .string({ error: "Invoice number is required." })
  .trim()
  .max(40, { error: "Invalid invoice number." });

/** Baca invoice milik customer yang sedang masuk, atau null. */
async function invoiceMilikSaya(invoiceNo: string, customerId: string) {
  return db().getInvoiceByNoForCustomer(invoiceNo, customerId);
}

export async function createInvoiceAction(formData: FormData): Promise<AdminActionState> {
  const customer = await getCustomer();
  if (!customer) return fail("Your session has expired. Please log in again.");

  const ip = await clientIp();
  if (!(await hitRateLimit("invoice", ip))) return fail(RATE_LIMIT_MESSAGE);
  if (!(await hitCustomRateLimit(`invoice:${customer.id}`, 5, 3600))) return fail(RATE_LIMIT_MESSAGE);

  const parsed = createInvoiceSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  // Harga TIDAK diambil dari form — hanya SKU-nya yang dipercaya.
  const paket = paketUntukInvoice(parsed.data.sku);
  if (!paket) return fail("That plan is no longer available. Please pick another one.");
  // Metode yang tidak terkonfigurasi tidak bisa dipakai sama sekali.
  if (!findMetode(parsed.data.metode)) return fail("That payment method is not available.");

  let invoice;
  try {
    invoice = await db().createInvoice({
      customer_id: customer.id,
      jenis: parsed.data.extend_order_id ? "perpanjangan" : "baru",
      ...paket,
      metode: parsed.data.metode,
      extend_order_id: parsed.data.extend_order_id,
      catatan: parsed.data.catatan,
      ttlJam: INVOICE_TTL_JAM,
      maksAktif: MAKS_INVOICE_AKTIF,
    });
  } catch (error) {
    if (error instanceof DbError) {
      if (error.code === "TOO_MANY_INVOICES") {
        return fail(
          `You already have ${MAKS_INVOICE_AKTIF} unpaid invoices. Please pay or cancel one of them first.`,
        );
      }
      if (error.code === "ORDER_NOT_FOUND") return fail("That order was not found in your account.");
      if (error.code === "DUPLICATE") return fail("You already have an open renewal invoice for that order.");
      if (error.code === "AMOUNT_COLLISION") {
        return fail("Too many invoices are open right now. Please try again in a few minutes.");
      }
    }
    console.error("[akun] gagal membuat invoice", error);
    return fail("Could not create the invoice. Please try again in a moment.");
  }

  // Webhook tidak boleh menahan customer: dikirim setelah respons terkirim.
  after(() => kabariDiscord("invoice_baru", invoice, customer));

  refreshAccount();
  redirect(`/account/invoice/${encodeURIComponent(invoice.invoice_no)}`);
}

export async function markInvoicePaidAction(formData: FormData): Promise<AdminActionState> {
  const customer = await getCustomer();
  if (!customer) return fail("Your session has expired. Please log in again.");

  const ip = await clientIp();
  if (!(await hitRateLimit("invoicePaid", ip))) return fail(RATE_LIMIT_MESSAGE);

  const parsed = z
    .object({ invoice_no: invoiceNoSchema, catatan: catatanSchema })
    .safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const invoice = await invoiceMilikSaya(parsed.data.invoice_no, customer.id);
  if (!invoice) return fail("Invoice not found.");
  if (invoice.status === "kedaluwarsa") {
    return fail("This invoice has expired. Please create a new one, or message us on WhatsApp if you already paid.");
  }

  try {
    const berubah = await db().markInvoicePaid(invoice.id, customer.id, parsed.data.catatan);
    // Klik kedua tidak mengirim ping kedua ke Discord.
    if (berubah) after(() => kabariDiscord("invoice_dibayar", { ...invoice, status: "menunggu_verifikasi" }, customer));
  } catch (error) {
    if (error instanceof DbError && error.code === "INVOICE_STATUS_INVALID") {
      return fail("This invoice can no longer be updated. Please refresh the page.");
    }
    console.error("[akun] gagal menandai invoice dibayar", error);
    return fail("Could not record your confirmation. Please try again in a moment.");
  }

  refreshAccount();
  revalidatePath(`/account/invoice/${invoice.invoice_no}`);
  return ok("Thanks — we've received your confirmation and will check the payment shortly.");
}

export async function cancelInvoiceAction(formData: FormData): Promise<AdminActionState> {
  const customer = await getCustomer();
  if (!customer) return fail("Your session has expired. Please log in again.");

  const parsed = z.object({ invoice_no: invoiceNoSchema }).safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const invoice = await invoiceMilikSaya(parsed.data.invoice_no, customer.id);
  if (!invoice) return fail("Invoice not found.");

  try {
    await db().cancelInvoice(invoice.id, customer.id);
  } catch (error) {
    if (error instanceof DbError && error.code === "INVOICE_STATUS_INVALID") {
      return fail("This invoice can no longer be canceled. Please refresh the page.");
    }
    console.error("[akun] gagal membatalkan invoice", error);
    return fail("Could not cancel the invoice. Please try again in a moment.");
  }

  refreshAccount();
  revalidatePath(`/account/invoice/${invoice.invoice_no}`);
  return ok("Invoice canceled.");
}
