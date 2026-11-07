import type { NextConfig } from "next";
import createMDX from "@next/mdx";
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
  // Izinkan file .md/.mdx diimpor (artikel blog disimpan di content/blog/*.mdx).
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  async redirects() {
    // Rute lama Bahasa Indonesia → rute Inggris baru (308 permanen) supaya
    // backlink / bookmark lama tidak mati setelah situs dialihkan ke Inggris.
    const renamed = [
      { source: "/akun/masuk", destination: "/account/login" },
      { source: "/akun/daftar", destination: "/account/register" },
      { source: "/akun/klaim", destination: "/account/claim" },
      { source: "/akun/beli", destination: "/account/buy" },
      { source: "/akun", destination: "/account" },
      { source: "/pesanan/:no", destination: "/orders/:no" },
      { source: "/pesanan", destination: "/orders" },
    ].map((r) => ({ ...r, permanent: true }));

    if (!legacyHost) return renamed;
    const fromLegacy = [{ type: "host" as const, value: legacyHost }];
    return [
      // Sementara (307) dulu; ubah ke permanent: true setelah yakin semuanya lancar.
      { source: "/", has: fromLegacy, destination: canonical, permanent: false },
      { source: "/:path+", has: fromLegacy, destination: `${canonical}/:path+`, permanent: false },
      ...renamed,
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

// Loader MDX (tanpa remark/rehype plugin agar aman dengan Turbopack).
const withMDX = createMDX({ extension: /\.mdx?$/ });

export default withMDX(nextConfig);
