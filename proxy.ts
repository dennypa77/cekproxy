import { NextResponse, type NextRequest } from "next/server";
import { BAHASA_BAWAAN, BAHASA_BERAWALAN } from "@/lib/i18n";

/**
 * Pembagi bahasa.
 *
 * Indonesia berada di alamat utama tanpa awalan, jadi permintaan seperti
 * `/pricing` DITULIS ULANG (bukan dialihkan) ke `/id/pricing`. Alamat yang
 * terlihat di bilah alamat tetap bersih, tapi Next merender segmen `[lang]`
 * yang benar.
 *
 * `/en/...` dibiarkan lewat apa adanya.
 *
 * Yang sengaja TIDAK disentuh: /api, /admin, /_next, serta berkas metadata
 * seperti robots.txt dan sitemap.xml — semuanya hidup di luar segmen bahasa.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sudahBerbahasa = BAHASA_BERAWALAN.some(
    (bahasa) => pathname === `/${bahasa}` || pathname.startsWith(`/${bahasa}/`),
  );
  if (sudahBerbahasa) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${BAHASA_BAWAAN}` : `/${BAHASA_BAWAAN}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Semua jalur KECUALI:
     * - api, admin  : di luar segmen bahasa
     * - _next       : aset build
     * - berkas ber-ekstensi (gambar, txt, xml, ico, dsb.)
     */
    "/((?!api|admin|_next|.*\\.[\\w]+$).*)",
  ],
};
