import { NextResponse } from "next/server";
import { formatProxy, PROXY_FORMATS, type ProxyFormat } from "@/lib/public-types";
import { getRotatingPool, pickRandom } from "@/lib/services/rotating";
import { authorizeRotating, type RotatingDenied } from "@/lib/services/rotating-access";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_COUNT = 50;

function deny(denied: RotatingDenied) {
  return NextResponse.json(
    { ok: false, error: denied.error },
    {
      status: denied.status,
      headers: {
        "cache-control": "no-store",
        ...(denied.retryAfter ? { "retry-after": String(denied.retryAfter) } : {}),
      },
    },
  );
}

/**
 * GET /api/rotating?key=dmr_...&count=1&country=US&format=ip:port:user:pass
 *
 * Mengembalikan proxy acak dari pool gabungan. Default balasannya teks biasa
 * (satu proxy per baris) agar mudah dipakai langsung oleh tools; format=json
 * untuk balasan terstruktur.
 */
export async function GET(request: Request) {
  const auth = await authorizeRotating(request);
  if (!auth.ok) return deny(auth.denied);

  const url = new URL(request.url);
  const rawCount = (url.searchParams.get("count") ?? "1").trim();
  const country = (url.searchParams.get("country") ?? "").trim().toUpperCase();
  const requestedFormat = (url.searchParams.get("format") ?? "ip:port:user:pass").trim();

  // Parameter keliru dijawab tegas, bukan diperbaiki diam-diam, supaya mudah di-debug customer.
  const count = /^[0-9]{1,3}$/.test(rawCount) ? Number.parseInt(rawCount, 10) : NaN;
  if (!(count >= 1 && count <= MAX_COUNT)) {
    return deny({ status: 400, error: `Parameter count harus angka 1-${MAX_COUNT}.` });
  }

  if (country && !/^[A-Z]{2}$/.test(country)) {
    return deny({ status: 400, error: "Parameter country harus 2 huruf, contoh: US." });
  }

  if (requestedFormat !== "json" && !(PROXY_FORMATS as readonly string[]).includes(requestedFormat)) {
    return deny({ status: 400, error: `Parameter format harus salah satu dari: ${PROXY_FORMATS.join(", ")}, json.` });
  }

  const pool = await getRotatingPool();
  const candidates = country
    ? pool.proxies.filter((proxy) => (proxy.country ?? "").toUpperCase() === country)
    : pool.proxies;

  if (candidates.length === 0) {
    return deny({
      status: 503,
      error: country
        ? `Tidak ada proxy untuk negara ${country} saat ini. Coba tanpa parameter country.`
        : "Pool proxy sedang kosong. Silakan coba lagi beberapa saat lagi.",
      retryAfter: 30,
    });
  }

  const picked = pickRandom(candidates, count);

  if (requestedFormat === "json") {
    return NextResponse.json(
      {
        ok: true,
        data: picked.map((proxy) => ({
          ip: proxy.ip,
          port: proxy.port,
          username: proxy.username,
          password: proxy.password,
          country: proxy.country,
        })),
      },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const format = requestedFormat as ProxyFormat;

  return new NextResponse(picked.map((proxy) => formatProxy(proxy, format)).join("\n") + "\n", {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
