import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge, buttonClass } from "@/components/ui";
import { getClientIp, isIPv4 } from "@/lib/ip";
import { siteUrl } from "@/lib/site";

// Needs the request to read the visitor's IP.
export const dynamic = "force-dynamic";

const TITLE = "What Is My IP Address? | dmproxy";
const DESCRIPTION =
  "Free tool: instantly see your public IP address and whether it's IPv4 or IPv6. Check what IP websites see when you connect, with or without a proxy.";

export const metadata: Metadata = {
  title: "What Is My IP Address?",
  description: DESCRIPTION,
  alternates: { canonical: "/tools/what-is-my-ip" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/tools/what-is-my-ip" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "What Is My IP",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  url: `${siteUrl()}/tools/what-is-my-ip`,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default async function WhatIsMyIpPage() {
  const h = new Headers(await headers());
  const ip = getClientIp(h);
  const known = ip !== "unknown";
  const version = known ? (isIPv4(ip) ? "IPv4" : "IPv6") : null;

  return (
    <>
      <JsonLd data={JSON_LD} />
      <SiteHeader />

      <main>
        <section className="border-b-2 border-line bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:py-20">
            <Badge tone="blue">Free tool</Badge>
            <h1 className="mt-4 font-display text-4xl leading-[0.95] font-extrabold tracking-tight text-ink uppercase sm:text-5xl">
              What is my <span className="text-brand">IP?</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm text-muted sm:text-base">
              This is the public IP address websites see when you connect right now.
            </p>

            <div className="mx-auto mt-8 max-w-xl rounded-3xl border-2 border-ink bg-paper p-6 sm:p-8">
              <p className="text-xs font-bold tracking-wider text-muted uppercase">Your IP address</p>
              <p className="mt-2 font-mono text-2xl font-extrabold break-all text-ink sm:text-4xl">
                {known ? ip : "Not detected"}
              </p>
              {version && (
                <p className="mt-3">
                  <Badge tone="green">{version}</Badge>
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink uppercase">
              Hide your real IP with a proxy
            </h2>
            <p className="mt-3 text-sm text-muted sm:text-base">
              A proxy routes your traffic through a different IP, so sites see the proxy's address instead of your own.
              That's what makes it possible to manage many accounts, target a specific country, or access content that's
              limited by location.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/proxy-datacenter" className={buttonClass("primary", "md")}>
                Datacenter proxies
              </Link>
              <Link href="/proxy-residential" className={buttonClass("secondary", "md")}>
                Residential proxies
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
