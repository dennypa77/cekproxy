import type { Metadata } from "next";
import { HalamanKategori } from "@/components/landing/HalamanKategori";
import { kamus } from "@/lib/kamus";
import { alternatesDuaBahasa, bahasaDari } from "@/lib/seo";

export default function ResidentialProxyPage() {
  return <HalamanKategori kategoriId="residential" tone="green" lintasKe="/proxy-datacenter" />;
}

/**
 * Canonical & hreflang dibuat per bahasa. Metadata halaman menimpa milik
 * layout, jadi hreflang HARUS ikut disebut di sini — kalau tidak, ia hilang.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const bahasa = bahasaDari((await params).lang);
  const k = await kamus();
  const s = k.seo.residential;
  return {
    title: s.metaTitle,
    description: s.metaDesc,
    openGraph: { title: `${s.metaTitle} | dmproxy`, description: s.metaDesc, url: "/proxy-residential" },
    alternates: alternatesDuaBahasa(bahasa, "/proxy-residential"),
  };
}
