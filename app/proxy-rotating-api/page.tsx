import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { WhatsAppIcon } from "@/components/icons";
import { Badge, buttonClass } from "@/components/ui";
import { waHelpLink } from "@/lib/links";
import { siteUrl } from "@/lib/site";

const TITLE = "Rotating Proxy API — Random IPs from a Pool | dmproxy";
const DESCRIPTION =
  "A rotating proxy API: one endpoint and a secret key to pull random proxies from our pool, with your choice of count and country, straight from your script. Billed by validity and requests per minute, with no GB metering.";

export const metadata: Metadata = {
  title: "Rotating Proxy API",
  description: DESCRIPTION,
  alternates: { canonical: "/proxy-rotating-api" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/proxy-rotating-api" },
};

const FEATURES = [
  { title: "One endpoint, one key", body: "Pull proxies on demand from a single API endpoint secured by your secret key." },
  { title: "Choose count & country", body: "Request how many proxies you need and from which country, right in your call." },
  { title: "No GB metering", body: "Limited by plan validity and requests per minute — not by gigabytes used." },
];

const SERVICE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Rotating Proxy API",
  serviceType: "Rotating proxy service",
  description: DESCRIPTION,
  provider: { "@type": "Organization", name: "dmproxy", url: siteUrl() },
  url: `${siteUrl()}/proxy-rotating-api`,
  areaServed: "Worldwide",
};

export default function RotatingApiPage() {
  return (
    <>
      <JsonLd data={SERVICE_JSON_LD} />
      <SiteHeader />

      <main>
        <section className="border-b-2 border-line bg-surface">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
            <Badge tone="blue">For automation</Badge>
            <h1 className="mt-4 font-display text-4xl leading-[0.95] font-extrabold tracking-tight text-ink uppercase sm:text-6xl">
              Rotating proxy <span className="text-brand">API</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm text-muted sm:text-base">
              One API endpoint and a secret key to pull random proxies from our pool — choose the count and country
              straight from your script. Pricing depends on your needs, so reach out for a quote.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={waHelpLink()} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "lg")}>
                <WhatsAppIcon className="size-4" /> Ask for pricing
              </a>
              <Link href="/proxy-datacenter" className={buttonClass("secondary", "lg")}>
                See standard plans
              </Link>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-3xl border-2 border-ink bg-surface p-5">
                  <h2 className="font-display text-base font-extrabold tracking-tight text-ink uppercase">{f.title}</h2>
                  <p className="mt-1.5 text-sm text-muted">{f.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-3xl border-2 border-brand/50 bg-surface-2 p-6 sm:p-8">
              <h2 className="font-display text-xl font-extrabold tracking-tight text-ink uppercase">How it works</h2>
              <ol className="mt-4 space-y-3 text-sm text-muted">
                <li>1. We set up your pool and issue an API endpoint plus a secret key.</li>
                <li>2. Your script calls the endpoint with the count and country you want.</li>
                <li>3. You receive ready-to-use proxies — repeat as often as your per-minute limit allows.</li>
              </ol>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
