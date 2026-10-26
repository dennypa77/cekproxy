import "server-only";
import { ROTATING_KEY_PATTERN } from "../api-key";
import { db, type Order } from "../db";
import { getClientIp } from "../ip";
import { hitCustomRateLimit, hitRateLimit, RATE_LIMIT_MESSAGE } from "../rate-limit";

export type RotatingDenied = { status: number; error: string; retryAfter?: number };

/**
 * Validasi akses API rotating: kunci benar, pesanan aktif, belum expired,
 * dan belum melewati batas permintaan per menit.
 */
export async function authorizeRotating(request: Request): Promise<{ ok: true; order: Order } | { ok: false; denied: RotatingDenied }> {
  const ip = getClientIp(request.headers);
  const url = new URL(request.url);
  const header = request.headers.get("x-api-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const key = (url.searchParams.get("key") ?? header ?? "").trim();

  // Kunci salah dibatasi per IP (anti coba-coba kunci). Kunci yang benar tidak
  // dibatasi per IP, karena batasnya sudah per pesanan (rate_per_minute).
  const rejectKey = async (): Promise<{ ok: false; denied: RotatingDenied }> => {
    if (!(await hitRateLimit("api", ip))) {
      return { ok: false, denied: { status: 429, error: RATE_LIMIT_MESSAGE, retryAfter: 60 } };
    }
    return { ok: false, denied: { status: 401, error: "Kunci API tidak valid." } };
  };

  if (!key || !ROTATING_KEY_PATTERN.test(key)) return rejectKey();

  const order = await db().getOrderByApiKey(key);
  if (!order || order.order_type !== "rotating") return rejectKey();
  if (!order.is_active) {
    return { ok: false, denied: { status: 403, error: "Pesanan sedang tidak aktif. Hubungi admin." } };
  }
  if (new Date(order.expires_at).getTime() <= Date.now()) {
    return { ok: false, denied: { status: 403, error: "Masa aktif sudah berakhir. Silakan perpanjang." } };
  }

  const allowed = await hitCustomRateLimit(`rotating:${order.id}`, order.rate_per_minute, 60);
  if (!allowed) {
    return {
      ok: false,
      denied: {
        status: 429,
        error: `Batas ${order.rate_per_minute} permintaan per menit terlampaui. Coba lagi sebentar lagi.`,
        retryAfter: 60,
      },
    };
  }

  return { ok: true, order };
}
