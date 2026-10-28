import "server-only";

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/** Saat development, tampilkan penyebab error konfigurasi agar mudah diperbaiki. Di produksi selalu null. */
export function devConfigHint(error: unknown): string | null {
  if (isProduction() || !(error instanceof ConfigError)) return null;
  return `[Mode development] ${error.message} Buat file .env.local (lihat .env.example) lalu jalankan ulang npm run dev.`;
}

export function isTestMode(): boolean {
  return process.env.WEBSHARE_TEST_MODE?.trim().toLowerCase() === "true";
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getSupabaseConfig(): { url: string; serviceRoleKey: string } | null {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && serviceRoleKey ? { url, serviceRoleKey } : null;
}

export function getAdminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD;
  return value && value.length > 0 ? value : null;
}

const DEV_SESSION_SECRET = "dev-only-insecure-session-secret-do-not-use-in-prod";

export function getSessionSecret(): string {
  const value = process.env.SESSION_SECRET?.trim();
  if (value && value.length >= 32) return value;
  if (!isProduction()) return DEV_SESSION_SECRET;
  throw new ConfigError("SESSION_SECRET belum di-set atau kurang dari 32 karakter.");
}

/**
 * Tanggal (YYYY-MM-DD, WIB) mulai halaman pesanan hanya bisa dibuka lewat akun.
 * Kosong = belum diwajibkan (masa transisi masih berjalan tanpa batas).
 */
export function customerLoginRequiredFrom(): string | null {
  const value = process.env.CUSTOMER_LOGIN_REQUIRED_FROM?.trim();
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

/** Konfigurasi pengiriman WhatsApp (Fonnte). Null = fitur mati. */
export function getWaSenderConfig(): { token: string; endpoint: string } | null {
  const token = process.env.FONNTE_TOKEN?.trim();
  if (!token) return null;
  return { token, endpoint: process.env.FONNTE_ENDPOINT?.trim() || "https://api.fonnte.com/send" };
}

/** Rahasia untuk memverifikasi pemanggilan cron dari Vercel. */
export function getCronSecret(): string | null {
  const value = process.env.CRON_SECRET?.trim();
  return value && value.length >= 16 ? value : null;
}
