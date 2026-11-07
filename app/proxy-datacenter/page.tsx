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

const kategori = KATEGORI_HARGA.find((k) => k.id === "datacenter")!;

const TITLE = "Datacenter Proxies — Fast & Affordable | dmproxy";
const DESCRIPTION =
  "Buy fast datacenter proxies from $4. 50–1,000 IPs, same-day activation, self-service dashboard to replace IPs and manage your whitelist. Ideal for multi-accounting and high-volume automation.";

export const metadata: Metadata = {
  title: "Datacenter Proxies — Fast & Affordable",
  description: DESCRIPTION,
  alternates: { canonical: "/proxy-datacenter" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/proxy-datacenter" },
};

const USE_CASES = [
  { title: "Many accounts at once", body: "A cheap per-IP price point makes it easy to run a large pool of accounts in parallel." },
  { title: "High-volume automation", body: "Low latency and high throughput for scraping, checkers, and bots that need speed." },
  { title: "Bulk IP needs", body: "Order 50 to 1,000 IPs in a single plan and manage them all from one dashboard." },
];

const dcPrices = SEMUA_PAKET.filter((p) => p.kategoriId === "datacenter").map((p) => Math.round(p.hargaRp / IDR_PER_USD));

const PRODUCT_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Datacenter Proxies",
  description: DESCRIPTION,
  brand: { "@type": "Brand", name: "dmproxy" },
  url: `${siteUrl()}/proxy-datacenter`,
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: Math.min(...dcPrices),
    highPrice: Math.max(...dcPrices),
    offerCount: dcPrices.length,
    availability: "https://schema.org/InStock",
  },
};

export default function DatacenterProxyPage() {
  return (
    <>
      <JsonLd data={PRODUCT_JSON_LD} />
      <SiteHeader />

      <main>
        <section className="border-b-2 border-line bg-surface">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
            <Badge tone="yellow">Datacenter</Badge>
            <h1 className="mt-4 font-display text-4xl leading-[0.95] font-extrabold tracking-tight text-ink uppercase sm:text-6xl">
              Datacenter <span className="text-brand">proxies</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm text-muted sm:text-base">
              {kategori.ringkasan} High speed, the lowest price per IP, and same-day activation — the go-to choice when
              you need many IPs at once for multi-accounting or automation.
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
              Datacenter proxy pricing
            </h2>
            <p className="mt-2 mb-6 max-w-2xl text-sm text-muted">
              Prices in USD (IDR also listed). Every plan includes the full dashboard, IP replace quota, and whitelist
              management.
            </p>
            <CategoryPricingTable kategori={kategori} />
            <p className="mt-6 text-sm text-muted">
              Need residential IPs instead?{" "}
              <Link href="/proxy-residential" className="font-semibold text-brand hover:underline">
                See residential proxies
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
