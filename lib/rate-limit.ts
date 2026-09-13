import "server-only";
import { db } from "./db";

export const RATE_LIMITS = {
  /** pencarian nomor pesanan + setiap nomor pesanan yang tidak ditemukan */
  search: { max: 10, windowSeconds: 60 },
  replace: { max: 5, windowSeconds: 60 },
  whitelist: { max: 10, windowSeconds: 60 },
  /** semua request API customer (bandwidth, proxy, dll.) */
  api: { max: 90, windowSeconds: 60 },
  login: { max: 5, windowSeconds: 300 },
} as const;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

const keyFor = (bucket: RateLimitBucket, ip: string) => `${bucket}:${ip}`;

/** Catat 1 percobaan. allowed=false jika melebihi batas. */
export async function hitRateLimit(bucket: RateLimitBucket, ip: string): Promise<boolean> {
  const { max, windowSeconds } = RATE_LIMITS[bucket];
  try {
    const count = await db().rateLimitHit(keyFor(bucket, ip), windowSeconds);
    return count <= max;
  } catch (error) {
    console.error(`[rate-limit] gagal mencatat ${bucket}`, error);
    return true;
  }
}

/** Cek tanpa menambah hitungan. true jika sudah terblokir. */
export async function isRateLimited(bucket: RateLimitBucket, ip: string): Promise<boolean> {
  try {
    return (await db().rateLimitPeek(keyFor(bucket, ip))) >= RATE_LIMITS[bucket].max;
  } catch (error) {
    console.error(`[rate-limit] gagal membaca ${bucket}`, error);
    return false;
  }
}

export const RATE_LIMIT_MESSAGE = "Terlalu banyak percobaan. Silakan tunggu 1 menit lalu coba lagi.";
