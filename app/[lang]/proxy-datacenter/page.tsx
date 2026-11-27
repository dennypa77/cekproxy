import type { Metadata } from "next";
import { HalamanKategori } from "@/components/landing/HalamanKategori";
import { kamus } from "@/lib/kamus";
import { alternatesDuaBahasa, bahasaDari } from "@/lib/seo";

export default function DatacenterProxyPage() {
  return <HalamanKategori kategoriId="datacenter" tone="yellow" lintasKe="/proxy-residential" />;
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
  const s = k.seo.datacenter;
  return {
    title: s.metaTitle,
    description: s.metaDesc,
    openGraph: { title: `${s.metaTitle} | dmproxy`, description: s.metaDesc, url: "/proxy-datacenter" },
    alternates: alternatesDuaBahasa(bahasa, "/proxy-datacenter"),
  };
}
