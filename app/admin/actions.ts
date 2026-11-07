"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "@/lib/zod";
import { generateClaimCode, generateRotatingKey } from "@/lib/api-key";
import { cacheKeys, invalidate } from "@/lib/cache";
import { db, DbError, type WaTemplate } from "@/lib/db";
import { checkoutEnabled, getAdminPassword } from "@/lib/env";
import { endOfJakartaDay, formatDateTime, maskSecret } from "@/lib/format";
import { getClientIp } from "@/lib/ip";
import { customerPath } from "@/lib/links";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { normalizeWaNumber, WA_NUMBER_PATTERN } from "@/lib/wa-number";
import { orderNoSchema } from "@/lib/order-no";
import { planLabel } from "@/lib/plan-type";
import type { AdminActionState } from "@/lib/public-types";
import { hitRateLimit } from "@/lib/rate-limit";
import { invalidateRotatingPool } from "@/lib/services/rotating";
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
  return (await isAdmin()) ? null : fail("Admin session expired. Please log in again.");
}

function jakartaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
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
  return error.issues[0]?.message ?? "Invalid data.";
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Maximum ${max} characters.` })
    .optional()
    .transform((value) => (value ? value : null));

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((value) => (value ? value : null))
  .pipe(z.email({ error: "Invalid email format." }).nullable());

const apiKeySchema = z
  .string({ error: "API key is required." })
  .trim()
  .min(10, { error: "API key is too short." })
  .max(200, { error: "API key is too long." })
  .regex(/^\S+$/, { error: "API key cannot contain spaces." });

const dateInputSchema = z
  .string({ error: "Expiry date is required." })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Invalid expiry date." })
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00+07:00`).getTime()), {
    error: "Invalid expiry date.",
  });

const quotaSchema = z.coerce
  .number({ error: "Quota must be a number." })
  .int({ error: "Quota must be a whole number." })
  .min(0, { error: "Quota must be at least 0." })
  .max(10_000, { error: "Quota is too large." });

function describeUpstream(error: unknown): string {
  if (error instanceof WebshareError) {
    if (error.kind === "auth") return "API key rejected (invalid or revoked).";
    return `Validation failed [${error.kind}${error.status ? ` ${error.status}` : ""}]: ${error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}

function describeDb(error: unknown, duplicateMessage = "This record already exists."): string {
  if (error instanceof DbError) {
    if (error.code === "DUPLICATE") return duplicateMessage;
    if (error.code === "ACCOUNT_NOT_AVAILABLE") return "Account is not available (it may already be used by another order).";
    if (error.code === "ORDER_NOT_FOUND") return "Order not found.";
    if (error.code === "ALREADY_CLAIMED") return "This order has already been claimed by another customer account.";
    if (error.code === "CLAIM_CODE_INVALID") return "Claim code not recognized.";
    if (error.code === "CLAIM_CODE_EXPIRED") return "Claim code has expired.";
  }
  console.error("[admin]", error);
  return "A database error occurred. Check the server logs.";
}

/** Plan info columns saved to the database when an API key is validated. */
function planFields(info: ApiKeyInfo) {
  return {
    proxy_type: info.plan.proxy_type,
    proxy_subtype: info.plan.proxy_subtype,
    proxy_count: info.plan.proxy_count,
    bandwidth_limit_gb: info.plan.bandwidth_limit,
    plan_synced_at: new Date().toISOString(),
  };
}

function planSummary(info: ApiKeyInfo): string[] {
  const { plan } = info;
  const type = [plan.proxy_type, plan.proxy_subtype].filter(Boolean).join(" / ") || "-";
  return [
    `Type: ${planLabel(plan)}`,
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
  if (!(await hitRateLimit("login", ip))) return fail("Too many login attempts. Try again in 5 minutes.");
  if (!getAdminPassword()) return fail("ADMIN_PASSWORD is not set in the environment variables.");

  const password = formData.get("password");
  if (typeof password !== "string" || !checkAdminPassword(password)) return fail("Incorrect password.");

  await createAdminSession();
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Account pool
// ---------------------------------------------------------------------------

const labelSchema = z
  .string({ error: "Label is required." })
  .trim()
  .min(1, { error: "Label is required." })
  .max(100, { error: "Label must be at most 100 characters." });

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
  if (await repo.findAccountByApiKey(input.api_key)) return fail("This API key is already in the pool.");

  let info: ApiKeyInfo;
  try {
    info = await validateApiKey(input.api_key);
  } catch (error) {
    return fail(describeUpstream(error));
  }

  try {
    await repo.createAccount({ ...input, email: input.email ?? info.email, ...planFields(info) });
  } catch (error) {
    return fail(describeDb(error, "This API key is already in the pool."));
  }
  refreshAdmin();
  return ok(`Account "${input.label}" saved.`, planSummary(info));
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
  if (keys.length === 0) return fail("Enter at least one API key (one per line).");
  if (keys.length > MAX_BULK) return fail(`Maximum ${MAX_BULK} API keys per import.`);

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
        details[index] = `– ${label} — already in the pool, skipped`;
        continue;
      }
      try {
        const info = await validateApiKey(key);
        await repo.createAccount({
          label: info.email ?? `Account ${key.slice(-4)}`,
          email: info.email,
          api_key: key,
          catatan: null,
          ...planFields(info),
        });
        success++;
        details[index] = `✓ ${label} — ${planSummary(info).join(" · ")}`;
      } catch (error) {
        details[index] = `✗ ${label} — ${error instanceof DbError ? describeDb(error, "duplicate") : describeUpstream(error)}`;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(5, keys.length) }, worker));
  refreshAdmin();
  const message = `${success} of ${keys.length} accounts imported successfully.`;
  return success > 0 ? ok(message, details) : fail(message, details);
}

const reserveSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || !Number.isNaN(Number(value)), { error: "Reserve GB must be a number." })
  .transform((value) => (value === null ? null : Number(value)))
  .refine((value) => value === null || (value >= 0 && value <= 100000), { error: "Reserve GB is out of range." });

const updateAccountSchema = z.object({
  label: labelSchema,
  rotating_enabled: z
    .string()
    .optional()
    .transform((value) => value === "on" || value === "true"),
  rotating_reserve_gb: reserveSchema,
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
  const { label, api_key, email, catatan, rotating_enabled, rotating_reserve_gb } = parsed.data;

  const repo = db();
  const account = await repo.getAccount(accountId);
  if (!account) return fail("Account not found.");

  const patch: Parameters<typeof repo.updateAccount>[1] = {
    label,
    email,
    catatan,
    rotating_enabled,
    rotating_reserve_gb,
  };
  let details: string[] | undefined;

  if (api_key && api_key !== account.api_key) {
    const other = await repo.findAccountByApiKey(api_key);
    if (other && other.id !== accountId) return fail("This API key is already used by another account.");
    try {
      const info = await validateApiKey(api_key);
      details = planSummary(info);
      patch.api_key = api_key;
      patch.email = email ?? info.email;
      Object.assign(patch, planFields(info));
    } catch (error) {
      return fail(describeUpstream(error));
    }
  }

  try {
    await repo.updateAccount(accountId, patch);
  } catch (error) {
    return fail(describeDb(error, "This API key is already used by another account."));
  }
  if (patch.api_key) {
    await Promise.all(
      [cacheKeys.proxies, cacheKeys.countries, cacheKeys.bandwidth].map((key) => invalidate(key(accountId))),
    );
  }
  await invalidateRotatingPool();
  refreshAdmin();
  return ok("Account updated.", details);
}

export async function checkAccountAction(accountId: string): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;
  const repo = db();
  const account = await repo.getAccount(accountId);
  if (!account) return fail("Account not found.");
  try {
    const info = await validateApiKey(account.api_key);
    await repo.updateAccount(accountId, {
      ...planFields(info),
      ...(account.email ? {} : { email: info.email }),
    });
    refreshAdmin();
    return ok("API key valid, plan info updated.", planSummary(info));
  } catch (error) {
    return fail(describeUpstream(error));
  }
}

/** Re-fetch the plan info (proxy type) of all active accounts from Webshare. */
export async function syncPlansAction(): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const repo = db();
  const accounts = (await repo.listAccounts()).filter((account) => account.status !== "disabled");
  if (accounts.length === 0) return fail("No active accounts in the pool yet.");

  const details: string[] = new Array(accounts.length);
  let success = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < accounts.length) {
      const index = cursor++;
      const account = accounts[index];
      try {
        const info = await validateApiKey(account.api_key);
        await repo.updateAccount(account.id, planFields(info));
        success++;
        details[index] = `✓ ${account.label} — ${planLabel(info.plan)}`;
      } catch (error) {
        details[index] = `✗ ${account.label} — ${describeUpstream(error)}`;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(5, accounts.length) }, worker));
  refreshAdmin();
  const message = `${success} of ${accounts.length} accounts synced.`;
  return success > 0 ? ok(message, details) : fail(message, details);
}

/** Enable/disable an account's participation in the rotating pool. */
export async function toggleAccountRotatingAction(accountId: string): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const repo = db();
  const account = await repo.getAccount(accountId);
  if (!account) return fail("Account not found.");
  if (account.status === "disabled") return fail("A disabled account cannot join the rotating pool.");

  const next = !account.rotating_enabled;
  await repo.updateAccount(accountId, { rotating_enabled: next });
  await invalidateRotatingPool();
  refreshAdmin();
  return ok(
    next
      ? `Account "${account.label}" joined the rotating pool.`
      : `Account "${account.label}" removed from the rotating pool.`,
    next && account.rotating_reserve_gb === null
      ? ["Note: this account has no reserve GB yet, so it can be used up to the account limit."]
      : undefined,
  );
}

export async function toggleAccountDisabledAction(accountId: string): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;
  const repo = db();
  const account = await repo.getAccount(accountId);
  if (!account) return fail("Account not found.");
  if (account.status === "assigned") return fail("Account is linked to an order. Release it from the order first.");

  const next = account.status === "disabled" ? "available" : "disabled";
  await repo.updateAccount(accountId, { status: next });
  refreshAdmin();
  return ok(next === "disabled" ? "Account disabled." : "Account re-enabled (available).");
}

export async function deleteAccountAction(accountId: string): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;
  const repo = db();
  const account = await repo.getAccount(accountId);
  if (!account) return fail("Account not found.");

  const linked = account.status === "assigned" || (await repo.listOrders()).some((o) => o.account_id === accountId);
  if (linked) return fail("Account is still linked to an order and cannot be deleted.");

  try {
    await repo.deleteAccount(accountId);
  } catch (error) {
    return fail(describeDb(error));
  }
  refreshAdmin();
  return ok(`Account "${account.label}" deleted.`);
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

/** Buyer's WhatsApp number — optional, used to send claim codes & reminders. */
const optionalWaSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? normalizeWaNumber(value) : null))
  .refine((value) => value === null || WA_NUMBER_PATTERN.test(value), {
    error: "Invalid WhatsApp number. Example: 0812-3456-7890.",
  });

/** Claim code is valid for 7 days. */
const CLAIM_CODE_TTL_DAYS = 7;

const createOrderSchema = z.object({
  shopee_order_no: orderNoSchema,
  nama_customer: optionalText(100),
  wa_number: optionalWaSchema,
  account_id: z.string({ error: "Select an account." }).min(1, { error: "Select an available account." }),
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
      wa_number: input.wa_number,
    });
    refreshAdmin();
    return ok(`Order ${order.shopee_order_no} created.`, [
      `Expires: ${formatDateTime(order.expires_at)}`,
      `Customer page: ${customerPath(order.shopee_order_no)}`,
    ]);
  } catch (error) {
    return fail(describeDb(error, "Order number is already registered."));
  }
}

const ratePerMinuteSchema = z.coerce
  .number({ error: "Request limit must be a number." })
  .int({ error: "Request limit must be a whole number." })
  .min(1, { error: "Request limit must be at least 1." })
  .max(100_000, { error: "Request limit is too large." });

const rotatingOrderSchema = z.object({
  shopee_order_no: orderNoSchema,
  nama_customer: optionalText(100),
  wa_number: optionalWaSchema,
  expires_date: dateInputSchema,
  rate_per_minute: ratePerMinuteSchema,
  catatan: optionalText(2000),
});

/** Create a rotating order (shared pool, accessed via an API key). */
export async function createRotatingOrderAction(formData: FormData): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = rotatingOrderSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const input = parsed.data;

  try {
    const order = await db().createRotatingOrder({
      shopee_order_no: input.shopee_order_no,
      nama_customer: input.nama_customer,
      expires_at: endOfJakartaDay(input.expires_date),
      api_key: generateRotatingKey(),
      rate_per_minute: input.rate_per_minute,
      catatan: input.catatan,
      wa_number: input.wa_number,
    });
    refreshAdmin();
    return ok(`Rotating order ${order.shopee_order_no} created.`, [
      `API key: ${order.api_key}`,
      `Limit: ${order.rate_per_minute} requests/min`,
      `Expires: ${formatDateTime(order.expires_at)}`,
      `Customer page: ${customerPath(order.shopee_order_no)}`,
    ]);
  } catch (error) {
    return fail(describeDb(error, "Order number is already registered."));
  }
}

/** Replace the API key (the old key stops working immediately). */
export async function regenerateRotatingKeyAction(orderId: string): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const repo = db();
  const order = await repo.getOrder(orderId);
  if (!order) return fail("Order not found.");
  if (order.order_type !== "rotating") return fail("This order is not a rotating order.");

  const api_key = generateRotatingKey();
  try {
    await repo.updateOrder(orderId, { api_key });
  } catch (error) {
    return fail(describeDb(error));
  }
  refreshAdmin();
  return ok("API key replaced. The old key no longer works.", [`New key: ${api_key}`]);
}

/** Change the per-minute request limit of a rotating order. */
export async function updateRotatingLimitAction(orderId: string, formData: FormData): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = z.object({ rate_per_minute: ratePerMinuteSchema }).safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  try {
    await db().updateOrder(orderId, { rate_per_minute: parsed.data.rate_per_minute });
  } catch (error) {
    return fail(describeDb(error));
  }
  refreshAdmin();
  return ok(`Limit changed to ${parsed.data.rate_per_minute} requests/min.`);
}

// ---------------------------------------------------------------------------
// Claim codes & customer accounts
// ---------------------------------------------------------------------------

/** Create a new claim code for one order (the old code dies immediately). */
export async function generateClaimCodeAction(orderId: string): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const repo = db();
  const order = await repo.getOrder(orderId);
  if (!order) return fail("Order not found.");
  if (order.customer_id) {
    return fail("This order is already in a customer account. Release it first if you want to move it.");
  }

  const claim_code = generateClaimCode();
  const claim_code_expires_at = new Date(Date.now() + CLAIM_CODE_TTL_DAYS * 86_400_000).toISOString();
  try {
    await repo.updateOrder(orderId, { claim_code, claim_code_expires_at });
  } catch (error) {
    return fail(describeDb(error, "Claim code conflict, please try again."));
  }
  refreshAdmin();
  return ok("Claim code created.", [
    `Code: ${claim_code}`,
    `Valid until ${formatDateTime(claim_code_expires_at)}`,
  ]);
}

/** Revoke an unused claim code. */
export async function revokeClaimCodeAction(orderId: string): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  try {
    await db().updateOrder(orderId, { claim_code: null, claim_code_expires_at: null });
  } catch (error) {
    return fail(describeDb(error));
  }
  refreshAdmin();
  return ok("Claim code revoked.");
}

/** Release an order from a customer account (e.g. claimed by mistake). */
export async function detachOrderCustomerAction(orderId: string): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const repo = db();
  const order = await repo.getOrder(orderId);
  if (!order) return fail("Order not found.");
  if (!order.customer_id) return fail("This order is not linked to a customer account.");

  const note = `[${jakartaToday()}] Released from customer account by admin`;
  try {
    await repo.updateOrder(orderId, {
      customer_id: null,
      claimed_at: null,
      catatan: order.catatan ? `${order.catatan}\n${note}` : note,
    });
  } catch (error) {
    return fail(describeDb(error));
  }
  refreshAdmin();
  return ok("Order released from the customer account. Create a new claim code if you want to move it.");
}

/** Prepare claim codes for all active orders not yet claimed (transition period). */
export async function bulkGenerateClaimCodesAction(): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const repo = db();
  const orders = await repo.listOrders();
  const target = orders.filter((o) => o.is_active && !o.customer_id && !o.claim_code);
  if (target.length === 0) return ok("All active orders already have a claim code or have been claimed.");

  const expires = new Date(Date.now() + CLAIM_CODE_TTL_DAYS * 86_400_000).toISOString();
  let berhasil = 0;
  for (const order of target) {
    try {
      await repo.updateOrder(order.id, { claim_code: generateClaimCode(), claim_code_expires_at: expires });
      berhasil++;
    } catch (error) {
      console.error("[admin] failed to create claim code", order.shopee_order_no, error);
    }
  }
  refreshAdmin();
  return ok(`${berhasil} claim codes created.`, [
    `Valid until ${formatDateTime(expires)}`,
    "Send each code to the customer via their individual order page.",
  ]);
}

/** Block / unblock a customer account. Their active session is also revoked. */
export async function toggleCustomerBlockedAction(customerId: string): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const repo = db();
  const customer = await repo.getCustomer(customerId);
  if (!customer) return fail("Customer account not found.");

  const next = !customer.is_blocked;
  try {
    await repo.updateCustomer(customerId, {
      is_blocked: next,
      session_version: customer.session_version + 1,
    });
  } catch (error) {
    return fail(describeDb(error));
  }
  refreshAdmin();
  return ok(next ? `Account ${customer.nama} blocked.` : `Account ${customer.nama} re-enabled.`);
}

/** Reset a customer's password; the temporary password is returned to send via chat. */
export async function resetCustomerPasswordAction(customerId: string): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const repo = db();
  const customer = await repo.getCustomer(customerId);
  if (!customer) return fail("Customer account not found.");

  const sementara = generateTempPassword();
  try {
    await repo.updateCustomer(customerId, {
      password_hash: await hashPassword(sementara),
      session_version: customer.session_version + 1,
    });
  } catch (error) {
    return fail(describeDb(error));
  }
  refreshAdmin();
  return ok(`Password for ${customer.nama} reset.`, [
    `Temporary password: ${sementara}`,
    "Send it to the customer via WhatsApp and ask them to change it right away.",
  ]);
}

// ---------------------------------------------------------------------------
// WhatsApp follow-up (manual, from the admin's own number)
// ---------------------------------------------------------------------------

const TEMPLATE_VALID: WaTemplate[] = ["claim_code", "expiry_h3", "expiry_h1", "expired", "manual"];

/**
 * Mark one follow-up as sent via WhatsApp. Does not send anything —
 * it only records it so the customer isn't contacted twice for the same reason.
 */
export async function markFollowUpSentAction(
  orderId: string,
  template: string,
  waNumber: string,
): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  if (!TEMPLATE_VALID.includes(template as WaTemplate)) return fail("Message type not recognized.");

  const repo = db();
  const order = await repo.getOrder(orderId);
  if (!order) return fail("Order not found.");

  try {
    await repo.insertWaMessage({
      order_id: orderId,
      customer_id: order.customer_id,
      to_number: waNumber,
      template: template as WaTemplate,
      status: "sent",
      error: null,
      provider_id: null,
    });
  } catch (error) {
    if (error instanceof DbError && error.code === "DUPLICATE") {
      return fail("This follow-up has already been marked as sent.");
    }
    return fail(describeDb(error));
  }

  refreshAdmin();
  return ok(`Follow-up ${order.shopee_order_no} recorded as sent.`);
}

const updateOrderSchema = z.object({
  shopee_order_no: orderNoSchema,
  nama_customer: optionalText(100),
  wa_number: optionalWaSchema,
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
    if (!current) return fail("Order not found.");

    // If the date is unchanged, keep the old expiry time.
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
      wa_number: input.wa_number,
    });
  } catch (error) {
    return fail(describeDb(error, "Order number is already used by another order."));
  }
  refreshAdmin();
  return ok("Order updated.");
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
  return ok("Replace usage reset to 0.");
}

const extendSchema = z.object({
  days: z.coerce
    .number({ error: "Number of days must be a number." })
    .int({ error: "Number of days must be a whole number." })
    .min(1, { error: "At least 1 day." })
    .max(3650, { error: "At most 3650 days." }),
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
    return ok(`Extended by ${parsed.data.days} days.`, [
      `New expiry: ${formatDateTime(order.expires_at)}`,
      `Order number: ${order.shopee_order_no}`,
    ]);
  } catch (error) {
    return fail(describeDb(error, "The new order number is already used by another order."));
  }
}

export async function linkOrderAccountAction(orderId: string, formData: FormData): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;
  const accountId = formData.get("account_id");
  if (typeof accountId !== "string" || !accountId) return fail("Select an available account.");
  try {
    await db().setOrderAccount(orderId, accountId);
  } catch (error) {
    return fail(describeDb(error));
  }
  refreshAdmin();
  return ok("Account linked to the order.");
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
  return ok("Account released and set back to available.");
}

const proxyCredentialSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .refine((value) => value === undefined || PROXY_CREDENTIAL_PATTERN.test(value), {
    error: "Use 8–32 letters/digits with no spaces.",
  });

const credentialsSchema = z
  .object({ username: proxyCredentialSchema, password: proxyCredentialSchema })
  .refine((value) => Boolean(value.username || value.password), {
    error: "Enter a new username, a new password, or both.",
  });

/** Change the proxy username/password on the account linked to this order. */
export async function updateOrderCredentialsAction(orderId: string, formData: FormData): Promise<AdminActionState> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = credentialsSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const repo = db();
  const order = await repo.getOrder(orderId);
  if (!order) return fail("Order not found.");
  if (!order.account_id) return fail("This order does not have an account yet.");
  const account = await repo.getAccount(order.account_id);
  if (!account) return fail("Account not found.");

  try {
    const config = await updateProxyCredentials(account.api_key, parsed.data);
    await invalidate(cacheKeys.proxies(account.id));
    refreshAdmin();
    return ok("Proxy username & password changed.", [
      `Username: ${config.username}`,
      `Password: ${config.password}`,
      "The customer must update their app with the new credentials.",
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
  if (!order) return fail("Order not found.");
  await repo.updateOrder(orderId, { is_active: !order.is_active });
  refreshAdmin();
  return ok(order.is_active ? "Order deactivated." : "Order reactivated.");
}

// ---------------------------------------------------------------------------
// Invoice (checkout manual)
// ---------------------------------------------------------------------------

/** Sama seperti sisi customer: aksi invoice mati total saat checkout dimatikan. */
function checkoutMati(): AdminActionState | null {
  return checkoutEnabled() ? null : fail("Checkout is disabled (CHECKOUT_ENABLED is not set to true).");
}

const approveInvoiceSchema = z.object({
  account_id: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
  expires_date: z.string().trim().optional(),
  replace_quota: quotaSchema,
  catatan: optionalText(500),
});

/**
 * Setujui pembayaran: klaim akun + buat/perpanjang pesanan + tandai invoice
 * lunas, semuanya dalam satu transaksi di database. Kalau akunnya ternyata
 * sudah dipakai, tidak ada pesanan setengah jadi yang tertinggal.
 */
export async function approveInvoiceAction(invoiceId: string, formData: FormData): Promise<AdminActionState> {
  const denied = (await guard()) ?? checkoutMati();
  if (denied) return denied;

  const parsed = approveInvoiceSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const repo = db();
  const invoice = await repo.getInvoice(invoiceId);
  if (!invoice) return fail("Invoice not found.");
  if (invoice.status === "disetujui") return fail("This invoice has already been approved.");

  const perpanjangan = invoice.jenis === "perpanjangan";
  let expiresAt = new Date().toISOString();

  if (!perpanjangan) {
    if (!parsed.data.account_id) return fail("Pick an account to hand over.");
    const tanggal = dateInputSchema.safeParse(parsed.data.expires_date);
    if (!tanggal.success) return fail(firstIssue(tanggal.error));
    expiresAt = endOfJakartaDay(tanggal.data);
  }

  let order;
  try {
    order = await repo.approveInvoice(
      invoiceId,
      perpanjangan ? null : parsed.data.account_id,
      expiresAt,
      parsed.data.replace_quota,
      parsed.data.catatan,
    );
  } catch (error) {
    if (error instanceof DbError && error.code === "INVOICE_STATUS_INVALID") {
      return fail("This invoice can no longer be approved (it may have been handled already).");
    }
    return fail(describeDb(error));
  }

  // Pool rotating ikut berubah kalau akun baru saja dipakai.
  invalidateRotatingPool();
  refreshAdmin();
  return ok(
    perpanjangan
      ? `Renewal done. ${order.shopee_order_no} is now active until ${formatDateTime(order.expires_at)}.`
      : `Order ${order.shopee_order_no} created and handed to the customer.`,
    [`Customer page: ${customerPath(order.shopee_order_no)}`],
  );
}

const rejectInvoiceSchema = z.object({
  alasan: z
    .string({ error: "A reason is required." })
    .trim()
    .min(3, { error: "Please write a reason — the customer will see it." })
    .max(300, { error: "Maximum 300 characters." }),
});

export async function rejectInvoiceAction(invoiceId: string, formData: FormData): Promise<AdminActionState> {
  const denied = (await guard()) ?? checkoutMati();
  if (denied) return denied;

  const parsed = rejectInvoiceSchema.safeParse(formObject(formData));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  try {
    await db().rejectInvoice(invoiceId, parsed.data.alasan);
  } catch (error) {
    if (error instanceof DbError && error.code === "INVOICE_STATUS_INVALID") {
      return fail("This invoice can no longer be rejected.");
    }
    return fail(describeDb(error));
  }

  refreshAdmin();
  return ok("Invoice rejected. The customer can see the reason on their invoice page.");
}

export async function expireInvoiceAction(invoiceId: string): Promise<AdminActionState> {
  const denied = (await guard()) ?? checkoutMati();
  if (denied) return denied;

  try {
    await db().expireInvoice(invoiceId);
  } catch (error) {
    if (error instanceof DbError && error.code === "INVOICE_STATUS_INVALID") {
      return fail("Only unpaid invoices can be marked expired.");
    }
    return fail(describeDb(error));
  }

  refreshAdmin();
  return ok("Invoice marked as expired.");
}
