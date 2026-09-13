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
