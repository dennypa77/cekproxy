import "server-only";
import { db } from "./db";

interface Envelope<T> {
  v: T;
  t: number;
}

export interface CachedValue<T> {
  value: T;
  cachedAt: number;
  fromCache: boolean;
}

/**
 * Cache bersama (tabel cache_entries). Gangguan cache tidak boleh menggagalkan
 * request — jika DB cache error, langsung panggil loader.
 * `maxAgeSeconds` membatasi umur cache yang masih diterima (untuk tombol refresh).
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
  options: { maxAgeSeconds?: number } = {},
): Promise<CachedValue<T>> {
  try {
    const hit = await db().cacheGet<Envelope<T>>(key);
    if (hit) {
      const age = (Date.now() - hit.t) / 1000;
      if (options.maxAgeSeconds === undefined || age <= options.maxAgeSeconds) {
        return { value: hit.v, cachedAt: hit.t, fromCache: true };
      }
    }
  } catch (error) {
    console.error(`[cache] gagal membaca ${key}`, error);
  }

  const value = await loader();
  const cachedAt = Date.now();
  try {
    await db().cacheSet(key, { v: value, t: cachedAt } satisfies Envelope<T>, ttlSeconds);
  } catch (error) {
    console.error(`[cache] gagal menyimpan ${key}`, error);
  }
  return { value, cachedAt, fromCache: false };
}

export async function invalidate(key: string): Promise<void> {
  try {
    await db().cacheDelete(key);
  } catch (error) {
    console.error(`[cache] gagal menghapus ${key}`, error);
  }
}

export const cacheKeys = {
  proxies: (accountId: string) => `proxies:${accountId}`,
  countries: (accountId: string) => `countries:${accountId}`,
  bandwidth: (accountId: string) => `bandwidth:${accountId}`,
  whitelist: (accountId: string) => `whitelist:${accountId}`,
};
