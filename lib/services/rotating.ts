import "server-only";
import { cached, invalidate } from "../cache";
import { db, type WebshareAccount } from "../db";
import { getBandwidth, getProxies } from "./proxy-data";

/*
 * Pool rotating: gabungan proxy dari akun-akun yang ditandai admin.
 *
 * Pengaman bandwidth: kalau akun punya cadangan (rotating_reserve_gb), akun
 * berhenti dipakai begitu pemakaiannya melewati (limit - cadangan), supaya
 * customer statis di akun itu tidak kehabisan kuota.
 */

export interface PoolProxy {
  ip: string;
  port: number;
  username: string;
  password: string;
  country: string | null;
  accountId: string;
  accountLabel: string;
}

export interface PoolAccountStatus {
  id: string;
  label: string;
  included: boolean;
  proxies: number;
  reason: string | null;
}

export interface RotatingPool {
  proxies: PoolProxy[];
  accounts: PoolAccountStatus[];
  builtAt: number;
}

const POOL_KEY = "rotating:pool";
const POOL_TTL = 60;
const CONCURRENCY = 3;

async function collect(account: WebshareAccount): Promise<{ status: PoolAccountStatus; proxies: PoolProxy[] }> {
  const base = { id: account.id, label: account.label };

  if (account.rotating_reserve_gb !== null) {
    try {
      const { usage } = await getBandwidth(account);
      const budget = usage.limitGb > 0 ? usage.limitGb - account.rotating_reserve_gb : Infinity;
      if (usage.usedGb >= budget) {
        return {
          status: { ...base, included: false, proxies: 0, reason: "cadangan bandwidth tercapai" },
          proxies: [],
        };
      }
    } catch (error) {
      console.error("[rotating] bandwidth tidak terbaca", account.label, error);
      return {
        status: { ...base, included: false, proxies: 0, reason: "bandwidth tidak terbaca" },
        proxies: [],
      };
    }
  }

  try {
    const proxies = (await getProxies(account))
      .filter((proxy) => proxy.valid)
      .map((proxy) => ({
        ip: proxy.proxy_address,
        port: proxy.port,
        username: proxy.username,
        password: proxy.password,
        country: proxy.country_code,
        accountId: account.id,
        accountLabel: account.label,
      }));
    return { status: { ...base, included: true, proxies: proxies.length, reason: null }, proxies };
  } catch (error) {
    console.error("[rotating] daftar proxy gagal", account.label, error);
    return { status: { ...base, included: false, proxies: 0, reason: "daftar proxy gagal dimuat" }, proxies: [] };
  }
}

async function buildPool(): Promise<RotatingPool> {
  const accounts = (await db().listAccounts()).filter(
    (account) => account.rotating_enabled && account.status !== "disabled",
  );

  const statuses: PoolAccountStatus[] = [];
  const proxies: PoolProxy[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < accounts.length) {
      const account = accounts[cursor++];
      const result = await collect(account);
      statuses.push(result.status);
      proxies.push(...result.proxies);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, accounts.length) }, worker));
  statuses.sort((a, b) => a.label.localeCompare(b.label));
  return { proxies, accounts: statuses, builtAt: Date.now() };
}

export async function getRotatingPool(options: { fresh?: boolean } = {}): Promise<RotatingPool> {
  const result = await cached(POOL_KEY, POOL_TTL, buildPool, options.fresh ? { maxAgeSeconds: 5 } : {});
  return result.value;
}

export function invalidateRotatingPool(): Promise<void> {
  return invalidate(POOL_KEY);
}

export function poolCountries(pool: RotatingPool): { code: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const proxy of pool.proxies) {
    const code = (proxy.country ?? "").toUpperCase();
    if (!code) continue;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
}

/** Ambil `count` proxy acak tanpa pengulangan. */
export function pickRandom(proxies: PoolProxy[], count: number): PoolProxy[] {
  if (count >= proxies.length) return [...proxies];
  const picked = new Set<number>();
  const result: PoolProxy[] = [];
  while (result.length < count) {
    const index = Math.floor(Math.random() * proxies.length);
    if (picked.has(index)) continue;
    picked.add(index);
    result.push(proxies[index]);
  }
  return result;
}
