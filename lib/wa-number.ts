/**
 * Nomor WhatsApp disimpan kanonik: hanya digit, selalu diawali 62.
 * Bentuk ini langsung cocok untuk tautan wa.me dan API gateway WhatsApp.
 */

/** 62 + 8xx… → total 11–14 digit (mis. 62812345678 … 628123456789012). */
export const WA_NUMBER_PATTERN = /^628[0-9]{8,11}$/;

export function normalizeWaNumber(raw: string): string {
  const digitsOnly = (raw ?? "").replace(/[^\d+]/g, "");
  let value = digitsOnly.replace(/^\+/, "");
  if (value.startsWith("00")) value = value.slice(2);
  if (value.startsWith("0")) value = `62${value.slice(1)}`;
  else if (value.startsWith("8")) value = `62${value}`;
  return value;
}

export function isValidWaNumber(raw: string): boolean {
  return WA_NUMBER_PATTERN.test(normalizeWaNumber(raw));
}

/** Tampilan untuk admin: 628123456789 → +62 812-3456-789 */
export function formatWaNumber(waNumber: string): string {
  if (!WA_NUMBER_PATTERN.test(waNumber)) return waNumber;
  const rest = waNumber.slice(2); // buang 62
  const parts = [rest.slice(0, 3), rest.slice(3, 7), rest.slice(7)].filter(Boolean);
  return `+62 ${parts.join("-")}`;
}
