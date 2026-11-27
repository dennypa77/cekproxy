import Link from "next/link";
import { CategoryPricingTable } from "@/components/landing/CategoryPricingTable";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { WhatsAppIcon } from "@/components/icons";
import { Badge, buttonClass } from "@/components/ui";
import { jalur } from "@/lib/i18n";
import { bahasaSekarang, kamus } from "@/lib/kamus";
import { waOrderGeneralLink } from "@/lib/links";
import { IDR_PER_USD, KATEGORI_HARGA, SEMUA_PAKET } from "@/lib/pricing";
import { siteUrl } from "@/lib/site";

/**
 * Halaman SEO per kategori (datacenter & residential).
 *
 * Keduanya dulu dua berkas yang isinya hampir identik — kalimatnya hanya
 * berbeda beberapa kata. Begitu teksnya pindah ke kamus, menyalin struktur
 * yang sama dua kali jadi tidak ada gunanya dan justru mengundang keduanya
 * berbeda diam-diam. Jadi strukturnya disatukan di sini.
 */
export async function HalamanKategori({
  kategoriId,
  tone,
  lintasKe,
}: {
  kategoriId: "datacenter" | "residential";
  tone: "yellow" | "green";
  /** Halaman kategori lain yang ditautkan di bawah tabel harga. */
  lintasKe: string;
}) {
  const k = await kamus();
  const bahasa = await bahasaSekarang();
  const s = k.seo[kategoriId];
  const kategori = KATEGORI_HARGA.find((item) => item.id === kategoriId)!;

  const harga = SEMUA_PAKET.filter((p) => p.kategoriId === kategoriId).map((p) =>
    Math.round(p.hargaRp / IDR_PER_USD),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: s.metaTitle,
    description: s.metaDesc,
    brand: { "@type": "Brand", name: "dmproxy" },
    url: `${siteUrl()}${jalur(bahasa, `/proxy-${kategoriId}`)}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: Math.min(...harga),
      highPrice: Math.max(...harga),
      offerCount: harga.length,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <SiteHeader />

      <main>
        <section className="border-b-2 border-line bg-surface">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
            <Badge tone={tone}>{s.badge}</Badge>
            <h1 className="mt-4 font-display text-4xl leading-[0.95] font-extrabold tracking-tight text-ink uppercase sm:text-6xl">
              {s.judul} <span className="text-brand">{s.aksen}</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm text-muted sm:text-base">
              {k.harga.kategori[kategoriId].ringkasan}
              {s.ringkasTambahan}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#pricing" className={buttonClass("primary", "lg")}>
                {k.seo.lihatHarga}
              </Link>
              <a
                href={waOrderGeneralLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("secondary", "lg")}
              >
                <WhatsAppIcon className="size-4" /> {k.umum.tanyaKami}
              </a>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {s.gunaUntuk.map((item) => (
                <div key={item.judul} className="rounded-3xl border-2 border-ink bg-surface p-5">
                  <h2 className="font-display text-base font-extrabold tracking-tight text-ink uppercase">
                    {item.judul}
                  </h2>
                  <p className="mt-1.5 text-sm text-muted">{item.isi}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20 pb-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink uppercase">{s.hargaJudul}</h2>
            <p className="mt-2 mb-6 max-w-2xl text-sm text-muted">{s.hargaRingkas}</p>
            <CategoryPricingTable kategori={kategori} />
            <p className="mt-6 text-sm text-muted">
              {s.lintasAwal}{" "}
              <Link href={jalur(bahasa, lintasKe)} className="font-semibold text-brand hover:underline">
                {s.lintasTautan}
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
