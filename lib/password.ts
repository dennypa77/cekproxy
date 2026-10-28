import "server-only";
import { randomBytes, scrypt, scryptSync, timingSafeEqual, type ScryptOptions } from "node:crypto";

/** scrypt versi Promise (promisify kehilangan overload dengan options). */
function derive(plain: string, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(plain, salt, keylen, options, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

/**
 * Hash password memakai scrypt bawaan Node (tanpa dependensi tambahan).
 *
 * Format tersimpan: `scrypt$N$r$p$<salt base64url>$<hash base64url>`
 * Parameter ikut disimpan, jadi nilainya bisa dinaikkan nanti tanpa merusak
 * password lama (hash lama tetap bisa diverifikasi dengan parameternya sendiri).
 */
const N = 16_384; // 128 * N * r ≈ 16 MiB, masih di bawah maxmem default Node
const R = 8;
const P = 1;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;

function encode(salt: Buffer, hash: Buffer, n = N, r = R, p = P): string {
  return `scrypt$${n}$${r}$${p}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const hash = await derive(plain, salt, KEY_LENGTH, { N, r: R, p: P });
  return encode(salt, hash);
}

/** Versi sinkron, khusus seed database memori saat mode test. */
export function hashPasswordSync(plain: string): string {
  const salt = randomBytes(SALT_LENGTH);
  return encode(salt, scryptSync(plain, salt, KEY_LENGTH, { N, r: R, p: P }));
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[4], "base64url");
    expected = Buffer.from(parts[5], "base64url");
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;

  let actual: Buffer;
  try {
    actual = await derive(plain, salt, expected.length, { N: n, r, p });
  } catch {
    return false; // parameter aneh (mis. maxmem terlampaui) dianggap gagal
  }
  // timingSafeEqual melempar kalau panjangnya beda, jadi dicek lebih dulu.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Hash palsu untuk nomor WhatsApp yang tidak terdaftar. Login tetap menjalankan
 * verifikasi dengan hash ini supaya lama responsnya sama dan tidak bisa dipakai
 * menebak nomor mana yang sudah punya akun.
 */
export const DUMMY_PASSWORD_HASH = encode(
  Buffer.from("0123456789abcdef0123456789abcdef", "hex"),
  Buffer.from("f6f1d4ae2b7d4d9b8c0f3e5a1d2c4b6e8a9f0b1c2d3e4f5a6b7c8d9e0f1a2b3c", "hex"),
);

/** Password sementara yang mudah dibaca lewat chat (dipakai admin saat reset). */
export function generateTempPassword(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
