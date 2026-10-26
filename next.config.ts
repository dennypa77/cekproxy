import type { NextConfig } from "next";
import { siteUrl } from "./lib/site";

/**
 * Alamat lama (mis. "namaproject.vercel.app"). Jika di-set, semua kunjungan ke
 * alamat itu dialihkan ke domain utama dengan path yang sama. Kosongkan untuk
 * membiarkan kedua alamat jalan berdampingan.
 */
const legacyHost = process.env.LEGACY_HOST?.trim();
const canonical = siteUrl();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    if (!legacyHost) return [];
    const fromLegacy = [{ type: "host" as const, value: legacyHost }];
    return [
      // Sementara (307) dulu; ubah ke permanent: true setelah yakin semuanya lancar.
      { source: "/", has: fromLegacy, destination: canonical, permanent: false },
      { source: "/:path+", has: fromLegacy, destination: `${canonical}/:path+`, permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
