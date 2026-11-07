import type { Metadata } from "next";
import Link from "next/link";
import { CategoryPricingTable } from "@/components/landing/CategoryPricingTable";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { WhatsAppIcon } from "@/components/icons";
import { Badge, buttonClass } from "@/components/ui";
import { waOrderGeneralLink } from "@/lib/links";
import { IDR_PER_USD, KATEGORI_HARGA, SEMUA_PAKET } from "@/lib/pricing";
import { siteUrl } from "@/lib/site";

const kategori = KATEGORI_HARGA.find((k) => k.id === "residential")!;

const TITLE = "Residential Proxies — Real Home IPs | dmproxy";
const DESCRIPTION =
  "Buy residential proxies from $3. Real home-network IPs that look like ordinary users, with country selection and same-day activation. Ideal for strict sites and sensitive accounts.";

export const metadata: Metadata = {
  title: "Residential Proxies — Real Home IPs",
  description: DESCRIPTION,
  alternates: { canonical: "/proxy-residential" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/proxy-residential" },
};

const USE_CASES = [
  { title: "Strict sites", body: "Home-network IPs pass on sites that block datacenter ranges." },
  { title: "Looks like a real user", body: "Traffic appears to come from an ordinary residential connection." },
  { title: "Country targeting", body: "Pick a destination country when you replace IPs, while stock lasts." },
];

const resPrices = SEMUA_PAKET.filter((p) => p.kategoriId === "residential").map((p) => Math.round(p.hargaRp / IDR_PER_USD));

const PRODUCT_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Residential Proxies",
  description: DESCRIPTION,
  brand: { "@type": "Brand", name: "dmproxy" },
  url: `${siteUrl()}/proxy-residential`,
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: Math.min(...resPrices),
    highPrice: Math.max(...resPrices),
    offerCount: resPrices.length,
    availability: "https://schema.org/InStock",
  },
};

export default function ResidentialProxyPage() {
  return (
    <>
      <JsonLd data={PRODUCT_JSON_LD} />
      <SiteHeader />

      <main>
        <section className="border-b-2 border-line bg-surface">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
            <Badge tone="green">Residential</Badge>
            <h1 className="mt-4 font-display text-4xl leading-[0.95] font-extrabold tracking-tight text-ink uppercase sm:text-6xl">
              Residential <span className="text-brand">proxies</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm text-muted sm:text-base">
              {kategori.ringkasan} IPs come from real home networks, so your traffic looks like an ordinary user — the
              better fit for strict sites and sensitive accounts.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#pricing" className={buttonClass("primary", "lg")}>
                See pricing
              </Link>
              <a href={waOrderGeneralLink()} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "lg")}>
                <WhatsAppIcon className="size-4" /> Ask us
              </a>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {USE_CASES.map((u) => (
                <div key={u.title} className="rounded-3xl border-2 border-ink bg-surface p-5">
                  <h2 className="font-display text-base font-extrabold tracking-tight text-ink uppercase">{u.title}</h2>
                  <p className="mt-1.5 text-sm text-muted">{u.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-20 pb-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink uppercase">
              Residential proxy pricing
            </h2>
            <p className="mt-2 mb-6 max-w-2xl text-sm text-muted">
              Prices in USD (IDR also listed). Every plan includes the full dashboard, IP replace quota with country
              selection, and whitelist management.
            </p>
            <CategoryPricingTable kategori={kategori} />
            <p className="mt-6 text-sm text-muted">
              Need a cheaper per-IP price for bulk work?{" "}
              <Link href="/proxy-datacenter" className="font-semibold text-brand hover:underline">
                See datacenter proxies
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
