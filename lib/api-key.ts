import "server-only";
import { randomBytes } from "node:crypto";

/** Prefix agar kunci mudah dikenali kalau tercecer di log atau chat. */
const PREFIX = "dmr_";

/** Kunci API untuk pesanan rotating. Contoh: dmr_9f2c... (32 karakter hex). */
export function generateRotatingKey(): string {
  return PREFIX + randomBytes(16).toString("hex");
}

export const ROTATING_KEY_PATTERN = /^dmr_[a-f0-9]{32}$/;
