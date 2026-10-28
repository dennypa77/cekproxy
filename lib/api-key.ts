import "server-only";
import { randomBytes } from "node:crypto";
import { CLAIM_CODE_ALPHABET, CLAIM_CODE_LENGTH } from "./claim-code";

/** Prefix agar kunci mudah dikenali kalau tercecer di log atau chat. */
const PREFIX = "dmr_";

/** Kunci API untuk pesanan rotating. Contoh: dmr_9f2c... (32 karakter hex). */
export function generateRotatingKey(): string {
  return PREFIX + randomBytes(16).toString("hex");
}

export const ROTATING_KEY_PATTERN = /^dmr_[a-f0-9]{32}$/;

/**
 * Kode klaim pesanan untuk customer, mis. "K7M2P-9XQ4T".
 * 256 % 32 = 0, jadi pemetaan byte → alfabet tidak bias.
 */
export function generateClaimCode(): string {
  const bytes = randomBytes(CLAIM_CODE_LENGTH);
  const chars = Array.from(bytes, (b) => CLAIM_CODE_ALPHABET[b % CLAIM_CODE_ALPHABET.length]).join("");
  return `${chars.slice(0, 5)}-${chars.slice(5)}`;
}
