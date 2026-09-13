import { z } from "./zod";

/** Nomor pesanan disimpan UPPERCASE tanpa spasi. */
export function normalizeOrderNo(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export const ORDER_NO_PATTERN = /^[A-Z0-9-]{4,40}$/;

/** decodeURIComponent yang tidak melempar error untuk input rusak. */
export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export const orderNoSchema = z
  .string({ error: "Nomor pesanan wajib diisi." })
  .transform(normalizeOrderNo)
  .pipe(
    z
      .string()
      .min(1, { error: "Nomor pesanan wajib diisi." })
      .regex(ORDER_NO_PATTERN, { error: "Format nomor pesanan tidak valid (4–40 huruf/angka)." }),
  );
