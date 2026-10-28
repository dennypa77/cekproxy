/**
 * Kode klaim pesanan: 10 karakter Crockford base32 (tanpa huruf I, L, O, U)
 * ditulis sebagai dua blok, mis. K7M2P-9XQ4T. Entropinya 50 bit.
 *
 * File ini murni (tanpa node:crypto) supaya bisa dipakai di komponen browser
 * untuk merapikan ketikan customer. Pembuatan kodenya ada di lib/api-key.ts.
 */

export const CLAIM_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const CLAIM_CODE_LENGTH = 10;
export const CLAIM_CODE_PATTERN = /^[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/;

/**
 * Rapikan ketikan customer: huruf besar, buang pemisah, dan petakan huruf yang
 * mirip angka (O→0, I/L→1, U→V) supaya salah baca di chat tetap bisa masuk.
 */
export function normalizeClaimCode(raw: string): string {
  const cleaned = (raw ?? "")
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/U/g, "V")
    .slice(0, CLAIM_CODE_LENGTH);
  return cleaned.length > 5 ? `${cleaned.slice(0, 5)}-${cleaned.slice(5)}` : cleaned;
}

export function isValidClaimCode(raw: string): boolean {
  return CLAIM_CODE_PATTERN.test(normalizeClaimCode(raw));
}
