import "server-only";
import { NextResponse } from "next/server";
import { getClientIp } from "./ip";
import { safeDecode } from "./order-no";
import { hitRateLimit, isRateLimited, RATE_LIMIT_MESSAGE, type RateLimitBucket } from "./rate-limit";
import { ACCESS_MESSAGES, resolveCustomerOrder, type CustomerContext } from "./services/customer";

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status, headers: { "Cache-Control": "no-store" } });
}

export function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });
}

export const EXPIRED_MESSAGE = "Masa aktif proxy sudah berakhir. Perpanjang pesanan untuk menggunakan fitur ini.";

type RouteLoad = { ok: true; ctx: CustomerContext; ip: string } | { ok: false; response: NextResponse };

/**
 * Validasi request API customer: rate limit per IP, lalu cari pesanan.
 * Nomor pesanan yang tidak ditemukan dihitung ke limit pencarian (anti brute force).
 */
export async function loadCustomerRoute(
  request: Request,
  rawOrderNo: string,
  options: { bucket?: RateLimitBucket; requireNotExpired?: boolean } = {},
): Promise<RouteLoad> {
  const ip = getClientIp(request.headers);

  if (await isRateLimited("search", ip)) {
    return { ok: false, response: jsonError(RATE_LIMIT_MESSAGE, 429) };
  }
  if (!(await hitRateLimit("api", ip)) || (options.bucket && !(await hitRateLimit(options.bucket, ip)))) {
    return { ok: false, response: jsonError(RATE_LIMIT_MESSAGE, 429) };
  }

  let access;
  try {
    access = await resolveCustomerOrder(safeDecode(rawOrderNo));
  } catch (error) {
    console.error("[api] gagal membaca pesanan", error);
    return { ok: false, response: jsonError("Terjadi gangguan pada server. Silakan coba lagi.", 500) };
  }

  if (!access.ok) {
    if (access.reason === "not_found") await hitRateLimit("search", ip);
    return { ok: false, response: jsonError(ACCESS_MESSAGES[access.reason].title, 404) };
  }
  if (options.requireNotExpired && access.ctx.expired) {
    return { ok: false, response: jsonError(EXPIRED_MESSAGE, 403) };
  }
  return { ok: true, ctx: access.ctx, ip };
}
