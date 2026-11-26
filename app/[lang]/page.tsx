import type { Metadata } from "next";
import { alternatesDuaBahasa, bahasaDari } from "@/lib/seo";
import Link from "next/link";
import { Crosses, ServicePill } from "@/components/Brand";
import { FeatureBadges } from "@/components/landing/FeatureBadges";
import { AnnouncementBar } from "@/components/customer/AnnouncementBar";
import { SearchForm } from "@/components/customer/SearchForm";
import { GaugeIcon, ServerIcon, ShieldCheckIcon, SwapIcon, WhatsAppIcon } from "@/components/icons";
import { FaqSection } from "@/components/landing/FaqSection";
import { DatacenterBackdrop, TerminalHero } from "@/components/landing/TerminalHero";
import { PricingSection } from "@/components/landing/PricingSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { buttonClass } from "@/components/ui";
import { checkoutEnabled } from "@/lib/env";
import { isiVar, jalur } from "@/lib/i18n";
import { bahasaSekarang, kamus } from "@/lib/kamus";
import { waHelpLink, waOrderGeneralLink } from "@/lib/links";
import { MASA_AKTIF_HARI } from "@/lib/pricing";

// Dirender per permintaan supaya pita pengumuman (dan tanggal kedaluwarsanya)
// langsung berlaku tanpa perlu deploy ulang.
export const dynamic = "force-dynamic";

const META: Record<string, { title: string; description: string }> = {
  id: {
    title: "dmproxy — Proxy Datacenter & Residential",
    description:
      "Beli proxy datacenter dan residential yang cepat. Mulai $3, aktif di hari yang sama, dengan dashboard sendiri untuk cek bandwidth, ganti IP, dan atur whitelist. Tersedia juga API proxy rotating.",
  },
  en: {
    title: "dmproxy — Datacenter & Residential Proxies",
    description:
      "Buy fast datacenter and residential proxies. From $3, same-day activation, with a self-service dashboard to check bandwidth, replace IPs, and manage your IP whitelist. Rotating proxy API available.",
  },
};

export default async function HomePage() {
  const k = await kamus();
  const bahasa = await bahasaSekarang();
  // Checkout mandiri bisa dimatikan; teks & tombol ikut menyesuaikan.
  const checkout = checkoutEnabled();
  const LANGKAH = checkout ? k.caraPesan.checkout : k.caraPesan.wa;

  const KEUNGGULAN = [
    { icon: <GaugeIcon className="size-5" />, ...k.keunggulan.dashboard },
    { icon: <SwapIcon className="size-5" />, ...k.keunggulan.ganti },
    { icon: <ShieldCheckIcon className="size-5" />, ...k.keunggulan.whitelist },
    { icon: <ServerIcon className="size-5" />, ...k.keunggulan.jenis },
  ];

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
                <span className="block text-3xl text-ink sm:text-5xl">{k.hero.judulAtas}</span>
                <span className="block text-5xl text-brand sm:text-7xl">{k.hero.judulBawah}</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-sm text-muted sm:text-base lg:mx-0">
                {checkout ? k.hero.ringkasCheckout : k.hero.ringkasWa}
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
                {checkout ? (
                  <Link href={jalur(bahasa, "/account/buy")} className={buttonClass("primary", "lg")}>
                    {k.umum.pesanSekarang}
                  </Link>
                ) : (
                  <a
                    href={waOrderGeneralLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass("primary", "lg")}
                  >
                    <WhatsAppIcon className="size-5" /> {k.umum.pesanLewatWa}
                  </a>
                )}
                <a href="#pricing" className={buttonClass("secondary", "lg")}>
                  {k.umum.lihatHarga}
                </a>
              </div>
              <p className="mt-3 text-sm font-bold text-ink">
                {k.hero.tanpaBiaya} <span className="text-brand">{k.hero.tanpaBiayaAksen}</span>.
              </p>
              <p className="mt-1 text-xs text-muted">
                {k.hero.sudahPunyaAkun}{" "}
                <Link href={jalur(bahasa, "/account/login")} className="font-semibold text-brand hover:underline">
                  {k.hero.masukDiSini}
                </Link>
                {checkout ? k.hero.lanjutanCheckout : k.hero.lanjutanWa}
              </p>

              <FeatureBadges className="mt-8 lg:justify-start" />
              <p className="mt-4 text-xs font-bold tracking-wide text-muted uppercase">
                {isiVar(k.hero.ringkasBawah, { hari: MASA_AKTIF_HARI })}
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
                <p className="text-xs font-bold tracking-wider text-brand uppercase">{k.rotating.eyebrow}</p>
                <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight uppercase sm:text-3xl">
                  {k.rotating.judul}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-muted">{k.rotating.isi}</p>
              </div>
              {/* Dulu "Ask for pricing" ke WhatsApp; harga rotating kini tetap
                  dan tercantum di daftar harga, jadi diarahkan ke sana. */}
              <a href="#rotating" className={buttonClass("secondary", "md", "shrink-0")}>
                {k.rotating.tombolHarga}
              </a>
            </div>
          </div>
        </section>

        {/* Cara pesan */}
        <section id="how-to-order" className="scroll-mt-20 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl leading-tight font-extrabold tracking-tight text-ink uppercase sm:text-4xl">
                {k.caraPesan.judul} <span className="text-brand">{k.caraPesan.judulAksen}</span>
              </h2>
              <p className="mt-3 text-sm text-muted sm:text-base">{k.caraPesan.ringkas}</p>
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
                {k.cekPesanan.judul} <span className="text-brand">{k.cekPesanan.judulAksen}</span>
              </h2>
              <p className="mt-3 text-sm text-muted sm:text-base">{k.cekPesanan.ringkas}</p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
              <SearchForm />

              <div className="rounded-3xl border-2 border-ink bg-paper p-5">
                <h3 className="font-display text-base font-extrabold tracking-tight text-ink uppercase">
                  {k.cekPesanan.punyaBanyakJudul}
                </h3>
                <p className="mt-2 text-sm text-muted">{k.cekPesanan.punyaBanyakIsi}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={jalur(bahasa, "/account/register")} className={buttonClass("primary", "sm")}>
                    {k.umum.buatAkun}
                  </Link>
                  <Link href={jalur(bahasa, "/account/login")} className={buttonClass("secondary", "sm")}>
                    {k.umum.masuk}
                  </Link>
                </div>

                <h3 className="mt-6 font-display text-base font-extrabold tracking-tight text-ink uppercase">
                  {k.cekPesanan.nomorDiManaJudul}
                </h3>
                <p className="mt-2 text-sm text-muted">{k.cekPesanan.nomorDiManaIsi}</p>
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
  return { ...META[bahasa], alternates: alternatesDuaBahasa(bahasa, "/") };
}
