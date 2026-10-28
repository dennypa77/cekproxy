import "server-only";
import { NextResponse } from "next/server";
import { getClientIp } from "./ip";
import { safeDecode } from "./order-no";
import { hitRateLimit, isRateLimited, RATE_LIMIT_MESSAGE, type RateLimitBucket } from "./rate-limit";
import { ACCESS_MESSAGES, resolveCustomerOrder, type CustomerContext } from "./services/customer";
import { resolveOrderAccess } from "./services/order-access";
import type { WebshareAccount } from "./db";

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status, headers: { "Cache-Control": "no-store" } });
}

export function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });
}

export const EXPIRED_MESSAGE = "Masa aktif proxy sudah berakhir. Perpanjang pesanan untuk menggunakan fitur ini.";

/** Semua API customer di bawah /api/pesanan butuh akun yang tertaut. */
type RouteLoad =
  | { ok: true; ctx: CustomerContext & { account: WebshareAccount }; ip: string }
  | { ok: false; response: NextResponse };

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
  // Aturan akun customer sama dengan halaman pesanan, supaya API tidak jadi pintu belakang.
  const akses = await resolveOrderAccess(access.ctx.order);
  if (akses.gate !== "allow") {
    const pesan =
      akses.gate === "other"
        ? "Pesanan ini terdaftar di akun customer lain."
        : "Silakan masuk ke akun Anda untuk membuka pesanan ini.";
    return { ok: false, response: jsonError(pesan, 403) };
  }

  if (options.requireNotExpired && access.ctx.expired) {
    return { ok: false, response: jsonError(EXPIRED_MESSAGE, 403) };
  }
  const account = access.ctx.account;
  if (!account) {
    // Pesanan rotating tidak punya akun; endpoint ini khusus pesanan statis.
    return { ok: false, response: jsonError(ACCESS_MESSAGES.no_account.title, 404) };
  }
  return { ok: true, ctx: { ...access.ctx, account }, ip };
}
