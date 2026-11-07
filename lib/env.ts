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

/**
 * Checkout mandiri (katalog + invoice + pembayaran manual).
 *
 * Mati secara bawaan. Dinyalakan hanya setelah migrasi 0005 dijalankan di
 * Supabase — selama mati, halaman invoice tidak ada dan tombol pesan kembali
 * mengarah ke WhatsApp, jadi tidak ada kode yang menyentuh tabel invoices.
 * Mengubah nilainya perlu deploy ulang (halaman harga dirender saat build).
 */
export function checkoutEnabled(): boolean {
  return process.env.CHECKOUT_ENABLED?.trim().toLowerCase() === "true";
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

/** Webhook Discord untuk notifikasi invoice. Null = notifikasi mati. */
export function getDiscordWebhookUrl(): string | null {
  const value = process.env.DISCORD_WEBHOOK_URL?.trim();
  return value && /^https:\/\/discord(app)?\.com\/api\/webhooks\//.test(value) ? value : null;
}

/** ID Discord pemilik, untuk mention saat ada pembayaran masuk. */
export function getDiscordMentionId(): string | null {
  const value = process.env.DISCORD_MENTION_ID?.trim();
  return value && /^\d{17,20}$/.test(value) ? value : null;
}
