/**
 * Alamat publik aplikasi, dipakai untuk metadata dan preview link (Open Graph).
 * Bisa ditimpa lewat env `SITE_URL` kalau domainnya berganti.
 */
const DEFAULT_SITE_URL = "https://dmproxy.xyz";

export function siteUrl(): string {
  const raw = process.env.SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const trimmed = withProtocol.replace(/\/+$/, "");
  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

/** Nama domain tanpa protokol, untuk ditampilkan di gambar preview. */
export function siteHost(): string {
  return siteUrl().replace(/^https?:\/\//i, "");
}
