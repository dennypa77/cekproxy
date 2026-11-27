import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { WhatsAppIcon } from "@/components/icons";
import { Badge, buttonClass } from "@/components/ui";
import { isiVar, jalur } from "@/lib/i18n";
import { bahasaSekarang, kamus } from "@/lib/kamus";
import { waHelpLink } from "@/lib/links";
import { ROTATING_RATE_PER_MINUTE } from "@/lib/pricing";
import { alternatesDuaBahasa, bahasaDari } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

/** Batas count per panggilan di app/api/rotating/route.ts. */
const MAX_COUNT_API = 50;

export default async function RotatingApiPage() {
  const k = await kamus();
  const bahasa = await bahasaSekarang();
  const s = k.seo.rotating;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.metaTitle,
    serviceType: "Rotating proxy service",
    description: s.metaDesc,
    provider: { "@type": "Organization", name: "dmproxy", url: siteUrl() },
    url: `${siteUrl()}${jalur(bahasa, "/proxy-rotating-api")}`,
    areaServed: "Worldwide",
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <SiteHeader />

      <main>
        <section className="border-b-2 border-line bg-surface">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
            <Badge tone="blue">{s.badge}</Badge>
            <h1 className="mt-4 font-display text-4xl leading-[0.95] font-extrabold tracking-tight text-ink uppercase sm:text-6xl">
              {s.judul} <span className="text-brand">{s.aksen}</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm text-muted sm:text-base">{s.ringkas}</p>
            <p className="mt-3 max-w-2xl text-sm text-muted">
              <b className="text-ink">{s.kapanBergantiTebal}</b>
              {isiVar(s.kapanBerganti, { maks: MAX_COUNT_API, rate: ROTATING_RATE_PER_MINUTE })}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={jalur(bahasa, "/#rotating")} className={buttonClass("primary", "lg")}>
                {k.rotating.tombolHarga}
              </Link>
              <a
                href={waHelpLink()}
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
              {s.fitur.map((f) => (
                <div key={f.judul} className="rounded-3xl border-2 border-ink bg-surface p-5">
                  <h2 className="font-display text-base font-extrabold tracking-tight text-ink uppercase">{f.judul}</h2>
                  <p className="mt-1.5 text-sm text-muted">{f.isi}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-3xl border-2 border-brand/50 bg-surface-2 p-6 sm:p-8">
              <h2 className="font-display text-xl font-extrabold tracking-tight text-ink uppercase">
                {s.caraKerjaJudul}
              </h2>
              <ol className="mt-4 space-y-3 text-sm text-muted">
                {s.caraKerja.map((langkah) => (
                  <li key={langkah}>{langkah}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
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
  const s = k.seo.rotating;
  return {
    title: s.metaTitle,
    description: s.metaDesc,
    openGraph: { title: `${s.metaTitle} | dmproxy`, description: s.metaDesc, url: "/proxy-rotating-api" },
    alternates: alternatesDuaBahasa(bahasa, "/proxy-rotating-api"),
  };
}
