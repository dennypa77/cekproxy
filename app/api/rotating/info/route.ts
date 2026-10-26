import { NextResponse } from "next/server";
import type { RotatingInfo } from "@/lib/public-types";
import { getRotatingPool, poolCountries } from "@/lib/services/rotating";
import { authorizeRotating } from "@/lib/services/rotating-access";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** GET /api/rotating/info?key=dmr_... — ringkasan pool & kuota untuk customer. */
export async function GET(request: Request) {
  const auth = await authorizeRotating(request);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.denied.error },
      { status: auth.denied.status, headers: { "cache-control": "no-store" } },
    );
  }

  const fresh = new URL(request.url).searchParams.get("fresh") === "1";
  const pool = await getRotatingPool({ fresh });

  const data: RotatingInfo = {
    poolSize: pool.proxies.length,
    countries: poolCountries(pool),
    ratePerMinute: auth.order.rate_per_minute,
    expiresAt: auth.order.expires_at,
    updatedAt: new Date(pool.builtAt).toISOString(),
  };

  return NextResponse.json({ ok: true, data }, { headers: { "cache-control": "no-store" } });
}
