import "server-only";
import { randomUUID } from "node:crypto";
import { DbError, type Order, type ReplaceLog, type Repo, type WebshareAccount } from "./types";

/**
 * Database di memori — HANYA untuk mode test lokal tanpa Supabase.
 * Data hilang saat server restart. Isi awal sama dengan supabase/seed.sql.
 */
interface MemoryState {
  accounts: WebshareAccount[];
  orders: Order[];
  logs: ReplaceLog[];
  rate: Map<string, { count: number; expiresAt: number }>;
  cache: Map<string, { value: unknown; expiresAt: number }>;
}

const DAY = 86_400_000;

function seed(): MemoryState {
  const now = Date.now();
  const created = new Date(now).toISOString();
  return {
    accounts: [
      {
        id: "00000000-0000-4000-8000-000000000001",
        label: "Akun Demo 1",
        email: "demo1@example.com",
        api_key: "mock-key-1",
        status: "assigned",
        catatan: "Data contoh mode test: 150 proxy, bandwidth 84%",
        created_at: created,
      },
      {
        id: "00000000-0000-4000-8000-000000000002",
        label: "Akun Demo 2",
        email: "demo2@example.com",
        api_key: "mock-key-2",
        status: "assigned",
        catatan: "Data contoh mode test: 10 proxy, bandwidth 97%",
        created_at: created,
      },
      {
        id: "00000000-0000-4000-8000-000000000003",
        label: "Akun Demo 3",
        email: "demo3@example.com",
        api_key: "mock-key-3",
        status: "available",
        catatan: 'Data contoh mode test: akun kosong untuk mencoba "Tambah pesanan"',
        created_at: created,
      },
    ],
    orders: [
      {
        id: "00000000-0000-4000-8000-000000000011",
        shopee_order_no: "DEMOAKTIF001",
        account_id: "00000000-0000-4000-8000-000000000001",
        nama_customer: "Budi (contoh)",
        expires_at: new Date(now + 30 * DAY).toISOString(),
        replace_quota: 10,
        replace_used: 2,
        replace_lock_until: null,
        is_active: true,
        catatan: "Pesanan contoh: aktif 30 hari",
        created_at: created,
      },
      {
        id: "00000000-0000-4000-8000-000000000012",
        shopee_order_no: "DEMOEXPIRE002",
        account_id: "00000000-0000-4000-8000-000000000002",
        nama_customer: "Siti (contoh)",
        expires_at: new Date(now + 2 * DAY).toISOString(),
        replace_quota: 3,
        replace_used: 3,
        replace_lock_until: null,
        is_active: true,
        catatan: "Pesanan contoh: expired 2 hari lagi, kuota replace habis",
        created_at: created,
      },
    ],
    logs: [],
    rate: new Map(),
    cache: new Map(),
  };
}

const globalStore = globalThis as unknown as { __dmMemoryDb?: MemoryState };

function state(): MemoryState {
  globalStore.__dmMemoryDb ??= seed();
  return globalStore.__dmMemoryDb;
}

const clone = <T>(value: T): T => structuredClone(value);
const byCreatedDesc = (a: { created_at: string }, b: { created_at: string }) =>
  b.created_at.localeCompare(a.created_at);

function findOrder(id: string): Order {
  const order = state().orders.find((o) => o.id === id);
  if (!order) throw new DbError("ORDER_NOT_FOUND", "ORDER_NOT_FOUND");
  return order;
}

function jakartaDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export function createMemoryRepo(): Repo {
  return {
    async listAccounts() {
      return clone([...state().accounts].sort(byCreatedDesc));
    },
    async getAccount(id) {
      return clone(state().accounts.find((a) => a.id === id) ?? null);
    },
    async findAccountByApiKey(apiKey) {
      return clone(state().accounts.find((a) => a.api_key === apiKey) ?? null);
    },
    async createAccount(input) {
      if (state().accounts.some((a) => a.api_key === input.api_key)) {
        throw new DbError("DUPLICATE", "api_key sudah ada");
      }
      const account: WebshareAccount = {
        id: randomUUID(),
        status: "available",
        created_at: new Date().toISOString(),
        ...input,
      };
      state().accounts.push(account);
      return clone(account);
    },
    async updateAccount(id, patch) {
      const account = state().accounts.find((a) => a.id === id);
      if (!account) return;
      if (patch.api_key && state().accounts.some((a) => a.id !== id && a.api_key === patch.api_key)) {
        throw new DbError("DUPLICATE", "api_key sudah ada");
      }
      Object.assign(account, patch);
    },
    async deleteAccount(id) {
      if (state().orders.some((o) => o.account_id === id)) {
        throw new DbError("UNKNOWN", "akun masih tertaut");
      }
      state().accounts = state().accounts.filter((a) => a.id !== id);
    },

    async listOrders() {
      return clone([...state().orders].sort(byCreatedDesc));
    },
    async getOrder(id) {
      return clone(state().orders.find((o) => o.id === id) ?? null);
    },
    async getOrderByNo(orderNo) {
      return clone(state().orders.find((o) => o.shopee_order_no === orderNo) ?? null);
    },
    async createOrder(input) {
      const s = state();
      const account = s.accounts.find((a) => a.id === input.account_id);
      if (!account || account.status !== "available") {
        throw new DbError("ACCOUNT_NOT_AVAILABLE", "ACCOUNT_NOT_AVAILABLE");
      }
      if (s.orders.some((o) => o.shopee_order_no === input.shopee_order_no)) {
        throw new DbError("DUPLICATE", "nomor pesanan sudah ada");
      }
      const order: Order = {
        id: randomUUID(),
        replace_used: 0,
        replace_lock_until: null,
        is_active: true,
        created_at: new Date().toISOString(),
        ...input,
      };
      account.status = "assigned";
      s.orders.push(order);
      return clone(order);
    },
    async updateOrder(id, patch) {
      const order = findOrder(id);
      if (
        patch.shopee_order_no &&
        state().orders.some((o) => o.id !== id && o.shopee_order_no === patch.shopee_order_no)
      ) {
        throw new DbError("DUPLICATE", "nomor pesanan sudah ada");
      }
      Object.assign(order, patch);
    },
    async setOrderAccount(orderId, accountId) {
      const s = state();
      const order = findOrder(orderId);
      const oldId = order.account_id;
      if (oldId === accountId) return;
      if (accountId) {
        const next = s.accounts.find((a) => a.id === accountId);
        if (!next || next.status !== "available") {
          throw new DbError("ACCOUNT_NOT_AVAILABLE", "ACCOUNT_NOT_AVAILABLE");
        }
        next.status = "assigned";
      }
      order.account_id = accountId;
      const old = s.accounts.find((a) => a.id === oldId);
      if (old && old.status === "assigned") old.status = "available";
    },
    async extendOrder(orderId, days, newOrderNo) {
      const order = findOrder(orderId);
      if (
        newOrderNo &&
        newOrderNo !== order.shopee_order_no &&
        state().orders.some((o) => o.shopee_order_no === newOrderNo)
      ) {
        throw new DbError("DUPLICATE", "nomor pesanan sudah ada");
      }
      let note = `[${jakartaDate()}] Diperpanjang ${days} hari`;
      if (newOrderNo && newOrderNo !== order.shopee_order_no) {
        note += `. Nomor pesanan lama: ${order.shopee_order_no}`;
        order.shopee_order_no = newOrderNo;
      }
      const base = Math.max(new Date(order.expires_at).getTime(), Date.now());
      order.expires_at = new Date(base + days * DAY).toISOString();
      order.catatan = order.catatan ? `${order.catatan}\n${note}` : note;
      return clone(order);
    },

    async tryStartReplace(orderId, lockSeconds) {
      const order = state().orders.find((o) => o.id === orderId);
      const now = Date.now();
      if (
        !order ||
        !order.is_active ||
        !order.account_id ||
        new Date(order.expires_at).getTime() <= now ||
        order.replace_used >= order.replace_quota ||
        (order.replace_lock_until && new Date(order.replace_lock_until).getTime() >= now)
      ) {
        return false;
      }
      order.replace_used += 1;
      order.replace_lock_until = new Date(now + lockSeconds * 1000).toISOString();
      return true;
    },
    async releaseReplaceLock(orderId, rollback) {
      const order = state().orders.find((o) => o.id === orderId);
      if (!order) return;
      order.replace_lock_until = null;
      if (rollback) order.replace_used = Math.max(order.replace_used - 1, 0);
    },
    async decrementReplaceUsed(orderId) {
      const order = state().orders.find((o) => o.id === orderId);
      if (order) order.replace_used = Math.max(order.replace_used - 1, 0);
    },

    async insertReplaceLog(input) {
      const log: ReplaceLog = { id: randomUUID(), created_at: new Date().toISOString(), ...input };
      state().logs.push(log);
      return clone(log);
    },
    async listReplaceLogs(orderId, limit) {
      return clone(
        state()
          .logs.filter((l) => l.order_id === orderId)
          .sort(byCreatedDesc)
          .slice(0, limit),
      );
    },
    async listPendingReplaceLogs(orderId) {
      return clone(state().logs.filter((l) => l.order_id === orderId && l.status === "pending"));
    },
    async resolvePendingLog(logId, status, error) {
      const log = state().logs.find((l) => l.id === logId);
      if (!log || log.status !== "pending") return false;
      log.status = status;
      log.error = error;
      return true;
    },

    async rateLimitHit(key, windowSeconds) {
      const now = Date.now();
      const entry = state().rate.get(key);
      if (!entry || entry.expiresAt < now) {
        state().rate.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
        return 1;
      }
      entry.count += 1;
      return entry.count;
    },
    async rateLimitPeek(key) {
      const entry = state().rate.get(key);
      return entry && entry.expiresAt >= Date.now() ? entry.count : 0;
    },

    async cacheGet<T>(key: string) {
      const entry = state().cache.get(key);
      if (!entry || entry.expiresAt < Date.now()) return null;
      return clone(entry.value) as T;
    },
    async cacheSet(key, value, ttlSeconds) {
      state().cache.set(key, { value: clone(value), expiresAt: Date.now() + ttlSeconds * 1000 });
    },
    async cacheDelete(key) {
      state().cache.delete(key);
    },
  };
}
