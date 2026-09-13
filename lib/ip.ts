import { isIPv4 } from "node:net";
import { z } from "./zod";

/** IP client dari header request (Vercel mengisi x-forwarded-for / x-real-ip). */
export function getClientIp(headers: Headers): string {
  const candidates = [
    headers.get("x-forwarded-for")?.split(",")[0],
    headers.get("x-real-ip"),
    headers.get("x-vercel-forwarded-for")?.split(",")[0],
  ];
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value) return stripIpv4Mapped(value);
  }
  return "unknown";
}

function stripIpv4Mapped(ip: string): string {
  const match = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  return match ? match[1] : ip;
}

function isPublicIpv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  return true;
}

export const publicIpv4Schema = z
  .string({ error: "IP wajib diisi." })
  .trim()
  .refine((ip) => isIPv4(ip), { error: "Format IP tidak valid. Contoh yang benar: 103.10.20.30" })
  .refine((ip) => isPublicIpv4(ip), { error: "Gunakan IP publik (bukan IP lokal seperti 192.168.x.x)." });

export { isIPv4 };
