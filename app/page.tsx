import type { Metadata } from "next";
import Link from "next/link";
import { Crosses, FeatureBadges, ServicePill } from "@/components/Brand";
import { AnnouncementBar } from "@/components/customer/AnnouncementBar";
import { SearchForm } from "@/components/customer/SearchForm";
import { GaugeIcon, ServerIcon, ShieldCheckIcon, SwapIcon, WhatsAppIcon } from "@/components/icons";
import { FaqSection } from "@/components/landing/FaqSection";
import { DatacenterBackdrop, TerminalHero } from "@/components/landing/TerminalHero";
import { PricingSection } from "@/components/landing/PricingSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { buttonClass } from "@/components/ui";
import { waHelpLink } from "@/lib/links";
import { MASA_AKTIF_HARI } from "@/lib/pricing";

// Dirender per permintaan supaya pita pengumuman (dan tanggal kedaluwarsanya)
// langsung berlaku tanpa perlu deploy ulang.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "dmproxy — Datacenter & Residential Proxies",
  description:
    "Buy fast datacenter and residential proxies. From $3, same-day activation, with a self-service dashboard to check bandwidth, replace IPs, and manage your IP whitelist. Rotating proxy API available.",
  alternates: { canonical: "/" },
};

const KEUNGGULAN = [
  {
    icon: <GaugeIcon className="size-5" />,
    judul: "Your own dashboard",
    isi: "Check remaining bandwidth, validity, and your IP list anytime — all with your order number.",
  },
  {
    icon: <SwapIcon className="size-5" />,
    judul: "Self-service IP replace",
    isi: "Swap dead or blocked IPs yourself within your quota, with country selection.",
  },
  {
    icon: <ShieldCheckIcon className="size-5" />,
    judul: "IP whitelist",
    isi: "Decide which IPs may use your proxies yourself, no waiting on support.",
  },
  {
    icon: <ServerIcon className="size-5" />,
    judul: "Datacenter & residential",
    isi: "Pick fast and cheap, or home-user IPs that pass on strict sites.",
  },
];

const LANGKAH = [
  {
    judul: "Create an account",
    isi: "Sign up with your WhatsApp number and a password. That account is where every order of yours lives.",
  },
  { judul: "Pick a plan", isi: "Choose the IP count and bandwidth you need, then press Buy to get an invoice." },
  {
    judul: "Pay the exact amount",
    isi: "QRIS, BCA or BRI. The last 3 digits are unique to your invoice — that is how we recognise your transfer.",
  },
  {
    judul: "We activate it",
    isi: "We check every payment by hand, usually within 2 hours. Your proxies then appear in your dashboard.",
  },
];

export default function HomePage() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />

      <main id="atas">
        {/* Hero */}
        <section className="relative overflow-hidden border-b-2 border-line bg-surface">
          <DatacenterBackdrop />

          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1fr_minmax(0,28rem)]">
            <div className="text-center lg:text-left">
              <ServicePill />
              <h1 className="mt-6 font-display leading-[0.95] font-extrabold tracking-tight uppercase">
                <span className="block text-3xl text-ink sm:text-5xl">Fast proxies for</span>
                <span className="block text-5xl text-brand sm:text-7xl">any online job</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-sm text-muted sm:text-base lg:mx-0">
                Datacenter and residential, ready the same day. Order online and manage all your orders from a single
                dashboard.
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link href="/account/buy" className={buttonClass("primary", "lg")}>
                  Order now
                </Link>
                <a href="#pricing" className={buttonClass("secondary", "lg")}>
                  See pricing
                </a>
              </div>
              <p className="mt-3 text-sm font-bold text-ink">
                Pay only for your plan — <span className="text-brand">no service fee</span>.
              </p>
              <p className="mt-1 text-xs text-muted">
                Already have an account?{" "}
                <Link href="/account/login" className="font-semibold text-brand hover:underline">
                  Log in here
                </Link>{" "}
                · new buyers get a claim code from us.
              </p>

              <FeatureBadges className="mt-8 lg:justify-start" />
              <p className="mt-4 text-xs font-bold tracking-wide text-muted uppercase">
                From $3 · {MASA_AKTIF_HARI}-day plans · same-day activation
              </p>
            </div>

            <TerminalHero />
          </div>
        </section>

        {/* Keunggulan */}
        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {KEUNGGULAN.map((item) => (
                <div key={item.judul} className="rounded-3xl border-2 border-ink bg-surface p-5">
                  <span className="flex size-11 items-center justify-center rounded-full bg-ink text-paper">
                    {item.icon}
                  </span>
                  <h3 className="mt-3 font-display text-base font-extrabold tracking-tight text-ink uppercase">
                    {item.judul}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted">{item.isi}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PricingSection />

        {/* Rotating */}
        <section className="py-4 sm:py-8">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid-lines relative flex flex-col gap-5 overflow-hidden rounded-3xl border-2 border-brand/50 bg-surface-2 p-6 text-ink sm:flex-row sm:items-center sm:p-8">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold tracking-wider text-brand uppercase">For automation</p>
                <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight uppercase sm:text-3xl">
                  Rotating plans via API
                </h2>
                <p className="mt-2 max-w-xl text-sm text-muted">
                  One API endpoint and a secret key to pull random proxies from our pool — choose the count and country
                  straight from your script. Limited by validity and requests per minute, with no GB metering.
                </p>
              </div>
              <a
                href={waHelpLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("secondary", "md", "shrink-0")}
              >
                <WhatsAppIcon className="size-4" /> Ask for pricing
              </a>
            </div>
          </div>
        </section>

        {/* Cara pesan */}
        <section id="how-to-order" className="scroll-mt-20 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl leading-tight font-extrabold tracking-tight text-ink uppercase sm:text-4xl">
                How to <span className="text-brand">order</span>
              </h2>
              <p className="mt-3 text-sm text-muted sm:text-base">
                Just four steps. Prices shown are final — no marketplace service fee.
              </p>
            </div>

            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {LANGKAH.map((langkah, index) => (
                <li key={langkah.judul} className="rounded-3xl border-2 border-ink bg-surface p-5">
                  <span className="flex size-9 items-center justify-center rounded-full bg-brand-soft font-display text-base font-extrabold text-ink">
                    {index + 1}
                  </span>
                  <h3 className="mt-3 font-display text-base font-extrabold tracking-tight text-ink uppercase">
                    {langkah.judul}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted">{langkah.isi}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Cek pesanan */}
        <section id="check-order" className="scroll-mt-20 border-y-2 border-ink bg-surface py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <Crosses className="justify-center" />
              <h2 className="mt-4 font-display text-3xl leading-tight font-extrabold tracking-tight text-ink uppercase sm:text-4xl">
                Check your <span className="text-brand">order</span>
              </h2>
              <p className="mt-3 text-sm text-muted sm:text-base">
                Already bought? Enter your order number to see your proxy list, remaining bandwidth, and validity. Have
                more than one order? Create an account to keep them all in one place.
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
              <SearchForm />

              <div className="rounded-3xl border-2 border-ink bg-paper p-5">
                <h3 className="font-display text-base font-extrabold tracking-tight text-ink uppercase">
                  Have several orders?
                </h3>
                <p className="mt-2 text-sm text-muted">
                  Create an account with your WhatsApp number, then claim each order with the code we send — all on one
                  page.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/account/register" className={buttonClass("primary", "sm")}>
                    Create account
                  </Link>
                  <Link href="/account/login" className={buttonClass("secondary", "sm")}>
                    Log in
                  </Link>
                </div>

                <h3 className="mt-6 font-display text-base font-extrabold tracking-tight text-ink uppercase">
                  Where's my order number?
                </h3>
                <p className="mt-2 text-sm text-muted">
                  We send your order number over WhatsApp right after your proxies are activated — keep that chat handy.
                </p>
              </div>
            </div>
          </div>
        </section>

        <FaqSection />
      </main>

      <SiteFooter />
    </>
  );
}
