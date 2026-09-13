import "server-only";
import { createClient, type PostgrestError } from "@supabase/supabase-js";
import {
  DbError,
  type Order,
  type ReplaceLog,
  type Repo,
  type WebshareAccount,
} from "./types";

function toDbError(error: PostgrestError): DbError {
  if (error.code === "23505") return new DbError("DUPLICATE", error.message);
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

export function createSupabaseRepo(url: string, serviceRoleKey: string): Repo {
  const sb = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });

  return {
    async listAccounts() {
      const res = await sb.from("webshare_accounts").select("*").order("created_at", { ascending: false });
      return check(res) as WebshareAccount[];
    },
    async getAccount(id) {
      return check(await sb.from("webshare_accounts").select("*").eq("id", id).maybeSingle()) as WebshareAccount | null;
    },
    async findAccountByApiKey(apiKey) {
      const res = await sb.from("webshare_accounts").select("*").eq("api_key", apiKey).maybeSingle();
      return check(res) as WebshareAccount | null;
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
    async createOrder(input) {
      const res = await sb
        .rpc("create_order", {
          p_order_no: input.shopee_order_no,
          p_account_id: input.account_id,
          p_nama_customer: input.nama_customer,
          p_expires_at: input.expires_at,
          p_replace_quota: input.replace_quota,
          p_catatan: input.catatan,
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
