import "server-only";
import { createClient, type PostgrestError } from "@supabase/supabase-js";
import {
  type Customer,
  DbError,
  type Invoice,
  type Order,
  type ReplaceLog,
  type Repo,
  type WaMessage,
  type WebshareAccount,
} from "./types";

function toDbError(error: PostgrestError): DbError {
  if (error.code === "23505") return new DbError("DUPLICATE", error.message);
  if (error.message.includes("CLAIM_CODE_INVALID")) return new DbError("CLAIM_CODE_INVALID", error.message);
  if (error.message.includes("CLAIM_CODE_EXPIRED")) return new DbError("CLAIM_CODE_EXPIRED", error.message);
  if (error.message.includes("ALREADY_CLAIMED")) return new DbError("ALREADY_CLAIMED", error.message);
  if (error.message.includes("INVOICE_NOT_FOUND")) return new DbError("INVOICE_NOT_FOUND", error.message);
  if (error.message.includes("INVOICE_STATUS_INVALID")) return new DbError("INVOICE_STATUS_INVALID", error.message);
  if (error.message.includes("TOO_MANY_INVOICES")) return new DbError("TOO_MANY_INVOICES", error.message);
  if (error.message.includes("AMOUNT_COLLISION")) return new DbError("AMOUNT_COLLISION", error.message);
  if (error.message.includes("ACCOUNT_NOT_AVAILABLE")) {
    return new DbError("ACCOUNT_NOT_AVAILABLE", error.message);
  }
  if (error.message.includes("ORDER_NOT_FOUND")) return new DbError("ORDER_NOT_FOUND", error.message);
  return new DbError("UNKNOWN", `${error.code}: ${error.message}`);
}

function check<T>(result: { data: T; error: PostgrestError | null }): T {
  if (result.error) throw toDbError(result.error);
  return result.data;
}

/** PostgREST bisa mengirim kolom numeric sebagai string; samakan ke number. */
function normalizeAccount<T>(row: T): T {
  const account = row as unknown as Record<string, unknown> | null;
  if (!account) return row;
  for (const field of ["bandwidth_limit_gb", "rotating_reserve_gb"]) {
    const value = account[field];
    if (typeof value === "string" && value !== "") account[field] = Number(value);
  }
  return row;
}

export function createSupabaseRepo(url: string, serviceRoleKey: string): Repo {
  const sb = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });

  return {
    async listAccounts() {
      const res = await sb.from("webshare_accounts").select("*").order("created_at", { ascending: false });
      return (check(res) as WebshareAccount[]).map(normalizeAccount);
    },
    async getAccount(id) {
      const res = await sb.from("webshare_accounts").select("*").eq("id", id).maybeSingle();
      return normalizeAccount(check(res) as WebshareAccount | null);
    },
    async findAccountByApiKey(apiKey) {
      const res = await sb.from("webshare_accounts").select("*").eq("api_key", apiKey).maybeSingle();
      return normalizeAccount(check(res) as WebshareAccount | null);
    },
    async createAccount(input) {
      return check(await sb.from("webshare_accounts").insert(input).select("*").single()) as WebshareAccount;
    },
    async updateAccount(id, patch) {
      check(await sb.from("webshare_accounts").update(patch).eq("id", id));
    },
    async deleteAccount(id) {
      check(await sb.from("webshare_accounts").delete().eq("id", id));
    },

    async listOrders() {
      return check(await sb.from("orders").select("*").order("created_at", { ascending: false })) as Order[];
    },
    async getOrder(id) {
      return check(await sb.from("orders").select("*").eq("id", id).maybeSingle()) as Order | null;
    },
    async getOrderByNo(orderNo) {
      const res = await sb.from("orders").select("*").eq("shopee_order_no", orderNo).maybeSingle();
      return check(res) as Order | null;
    },
    async getOrderByApiKey(apiKey) {
      const res = await sb.from("orders").select("*").eq("api_key", apiKey).maybeSingle();
      return check(res) as Order | null;
    },
    async createRotatingOrder(input) {
      const res = await sb
        .from("orders")
        .insert({ ...input, order_type: "rotating", account_id: null, replace_quota: 0 })
        .select("*")
        .single();
      return check(res) as Order;
    },
    async createOrder(input) {
      const res = await sb
        .rpc("create_order", {
          p_order_no: input.shopee_order_no,
          p_account_id: input.account_id,
          p_nama_customer: input.nama_customer,
          p_expires_at: input.expires_at,
          p_replace_quota: input.replace_quota,
          p_catatan: input.catatan,
          p_wa_number: input.wa_number ?? null,
        })
        .single();
      return check(res) as Order;
    },
    async updateOrder(id, patch) {
      check(await sb.from("orders").update(patch).eq("id", id));
    },
    async setOrderAccount(orderId, accountId) {
      check(await sb.rpc("set_order_account", { p_order_id: orderId, p_account_id: accountId }));
    },
    async extendOrder(orderId, days, newOrderNo) {
      const res = await sb
        .rpc("extend_order", { p_order_id: orderId, p_days: days, p_new_order_no: newOrderNo })
        .single();
      return check(res) as Order;
    },

    async tryStartReplace(orderId, lockSeconds) {
      const used = check(await sb.rpc("try_start_replace", { p_order_id: orderId, p_lock_seconds: lockSeconds }));
      return used !== null && used !== undefined;
    },
    async releaseReplaceLock(orderId, rollback) {
      check(await sb.rpc("release_replace_lock", { p_order_id: orderId, p_rollback: rollback }));
    },
    async decrementReplaceUsed(orderId) {
      check(await sb.rpc("decrement_replace_used", { p_order_id: orderId }));
    },

    async insertReplaceLog(input) {
      return check(await sb.from("replace_logs").insert(input).select("*").single()) as ReplaceLog;
    },
    async listReplaceLogs(orderId, limit) {
      const res = await sb
        .from("replace_logs")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(limit);
      return check(res) as ReplaceLog[];
    },
    async listPendingReplaceLogs(orderId) {
      const res = await sb
        .from("replace_logs")
        .select("*")
        .eq("order_id", orderId)
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      return check(res) as ReplaceLog[];
    },
    async resolvePendingLog(logId, status, error) {
      const res = await sb
        .from("replace_logs")
        .update({ status, error })
        .eq("id", logId)
        .eq("status", "pending")
        .select("id");
      return (check(res) as { id: string }[]).length > 0;
    },

    async listCustomers() {
      const res = await sb.from("customers").select("*").order("created_at", { ascending: false });
      return check(res) as Customer[];
    },
    async getCustomer(id) {
      return check(await sb.from("customers").select("*").eq("id", id).maybeSingle()) as Customer | null;
    },
    async getCustomerByWa(waNumber) {
      const res = await sb.from("customers").select("*").eq("wa_number", waNumber).maybeSingle();
      return check(res) as Customer | null;
    },
    async createCustomer(input) {
      return check(await sb.from("customers").insert(input).select("*").single()) as Customer;
    },
    async updateCustomer(id, patch) {
      check(await sb.from("customers").update(patch).eq("id", id));
    },
    async listOrdersByCustomer(customerId) {
      const res = await sb
        .from("orders")
        .select("*")
        .eq("customer_id", customerId)
        .order("expires_at", { ascending: false });
      return check(res) as Order[];
    },
    async claimOrder(code, customerId) {
      const res = await sb.rpc("claim_order", { p_code: code, p_customer_id: customerId }).single();
      return check(res) as Order;
    },

    async listInvoices() {
      const res = await sb.from("invoices").select("*").order("created_at", { ascending: false });
      return check(res) as Invoice[];
    },
    async getInvoice(id) {
      return check(await sb.from("invoices").select("*").eq("id", id).maybeSingle()) as Invoice | null;
    },
    async getInvoiceByNoForCustomer(invoiceNo, customerId) {
      const res = await sb
        .from("invoices")
        .select("*")
        .eq("invoice_no", invoiceNo)
        .eq("customer_id", customerId)
        .maybeSingle();
      return check(res) as Invoice | null;
    },
    async listInvoicesByCustomer(customerId) {
      const res = await sb
        .from("invoices")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      return check(res) as Invoice[];
    },
    async createInvoice(input) {
      const res = await sb
        .rpc("create_invoice", {
          p_customer_id: input.customer_id,
          p_jenis: input.jenis,
          p_produk: input.produk,
          p_sku: input.paket_sku,
          p_paket_nama: input.paket_nama,
          p_kategori: input.kategori,
          p_ip: input.ip,
          p_bandwidth_gb: input.bandwidth_gb,
          p_masa_aktif_hari: input.masa_aktif_hari,
          p_harga_rp: input.harga_rp,
          p_metode: input.metode,
          p_extend_order_id: input.extend_order_id,
          p_catatan: input.catatan,
          p_ttl_jam: input.ttlJam,
          p_maks_aktif: input.maksAktif,
          p_rate_per_minute: input.rate_per_minute,
        })
        .single();
      return check(res) as Invoice;
    },
    async markInvoicePaid(invoiceId, customerId, catatan) {
      const res = await sb.rpc("mark_invoice_paid", {
        p_invoice_id: invoiceId,
        p_customer_id: customerId,
        p_catatan: catatan,
      });
      return check(res) === true;
    },
    async cancelInvoice(invoiceId, customerId) {
      check(await sb.rpc("cancel_invoice", { p_invoice_id: invoiceId, p_customer_id: customerId }));
    },
    async approveInvoice(invoiceId, accountId, expiresAt, replaceQuota, catatan) {
      const res = await sb
        .rpc("approve_invoice", {
          p_invoice_id: invoiceId,
          p_account_id: accountId,
          p_expires_at: expiresAt,
          p_replace_quota: replaceQuota,
          p_catatan: catatan,
        })
        .single();
      return check(res) as Order;
    },
    async rejectInvoice(invoiceId, alasan) {
      check(await sb.rpc("reject_invoice", { p_invoice_id: invoiceId, p_alasan: alasan }));
    },
    async expireInvoice(invoiceId) {
      check(await sb.rpc("expire_invoice", { p_invoice_id: invoiceId }));
    },
    async expireDueInvoices() {
      const res = await sb.rpc("expire_invoices");
      const data = check(res) as string[] | null;
      return data ?? [];
    },

    async insertWaMessage(input) {
      return check(await sb.from("wa_messages").insert(input).select("*").single()) as WaMessage;
    },
    async listWaMessages(limit) {
      const res = await sb
        .from("wa_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      return check(res) as WaMessage[];
    },
    async waMessageSent(orderId, template) {
      const res = await sb
        .from("wa_messages")
        .select("id")
        .eq("order_id", orderId)
        .eq("template", template)
        .eq("status", "sent")
        .limit(1);
      return ((check(res) as { id: string }[]) ?? []).length > 0;
    },

    async rateLimitHit(key, windowSeconds) {
      return Number(check(await sb.rpc("rate_limit_hit", { p_key: key, p_window_seconds: windowSeconds })));
    },
    async rateLimitPeek(key) {
      const res = await sb.from("rate_limits").select("count, expires_at").eq("key", key).maybeSingle();
      const row = check(res) as { count: number; expires_at: string } | null;
      if (!row || new Date(row.expires_at).getTime() < Date.now()) return 0;
      return row.count;
    },

    async cacheGet<T>(key: string) {
      const res = await sb.from("cache_entries").select("value, expires_at").eq("key", key).maybeSingle();
      const row = check(res) as { value: T; expires_at: string } | null;
      if (!row || new Date(row.expires_at).getTime() < Date.now()) return null;
      return row.value;
    },
    async cacheSet(key, value, ttlSeconds) {
      const expires_at = new Date(Date.now() + ttlSeconds * 1000).toISOString();
      check(await sb.from("cache_entries").upsert({ key, value, expires_at }));
    },
    async cacheDelete(key) {
      check(await sb.from("cache_entries").delete().eq("key", key));
    },
  };
}
