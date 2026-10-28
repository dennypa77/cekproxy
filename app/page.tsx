import type { Metadata } from "next";
import Link from "next/link";
import { Crosses, DotGrid, FeatureBadges, LogoMark, ServicePill } from "@/components/Brand";
import { AnnouncementBar } from "@/components/customer/AnnouncementBar";
import { SearchForm } from "@/components/customer/SearchForm";
import { GaugeIcon, ServerIcon, ShieldCheckIcon, ShopIcon, SwapIcon, WhatsAppIcon } from "@/components/icons";
import { FaqSection } from "@/components/landing/FaqSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { buttonClass } from "@/components/ui";
import { SHOPEE_STORE_URL, waHelpLink, waOrderGeneralLink } from "@/lib/links";
import { MASA_AKTIF_HARI } from "@/lib/pricing";

// Dirender per permintaan supaya pita PENGUMUMAN (dan tanggal kedaluwarsanya)
// langsung berlaku tanpa perlu deploy ulang.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "dmproxy — Jual Proxy Datacenter & Residential",
  description:
    "Jual proxy datacenter dan residential untuk kerja online. Mulai Rp65.000, pesan langsung ke admin tanpa biaya admin, lengkap dengan dashboard cek bandwidth, ganti IP, dan IP whitelist.",
};

const KEUNGGULAN = [
  {
    icon: <GaugeIcon className="size-5" />,
    judul: "Dashboard sendiri",
    isi: "Cek sisa bandwidth, masa aktif, dan daftar IP kapan saja — cukup dengan nomor pesanan Shopee.",
  },
  {
    icon: <SwapIcon className="size-5" />,
    judul: "Ganti IP mandiri",
    isi: "IP mati atau terblokir bisa Anda ganti sendiri sesuai kuota, lengkap dengan pilihan negara.",
  },
  {
    icon: <ShieldCheckIcon className="size-5" />,
    judul: "IP whitelist",
    isi: "Atur sendiri IP mana yang boleh memakai proxy Anda, tanpa perlu menunggu admin.",
  },
  {
    icon: <ServerIcon className="size-5" />,
    judul: "Datacenter & residential",
    isi: "Pilih yang cepat dan hemat, atau yang terlihat seperti pengguna rumahan untuk situs ketat.",
  },
];

const LANGKAH = [
  { judul: "Pilih paket", isi: "Tentukan jumlah IP dan bandwidth yang Anda butuhkan di daftar harga di atas." },
  {
    judul: "Chat admin",
    isi: "Klik Pesan langsung — paket yang Anda pilih sudah terisi otomatis di chat. Admin membalas dengan cara bayarnya.",
  },
  {
    judul: "Terima nomor pesanan",
    isi: "Setelah pembayaran masuk, kami aktifkan proxy dan mengirim nomor pesanan Anda lewat chat.",
  },
  {
    judul: "Buka dashboard",
    isi: "Buat akun dengan nomor WhatsApp Anda, klaim pesanan memakai kode dari admin, lalu kelola semua pesanan di satu halaman.",
  },
];

const LETAK_NOMOR = [
  <>
    Buka aplikasi Shopee, pilih menu <b>Saya</b>.
  </>,
  <>
    Masuk ke <b>Pesanan Saya</b>, pilih pesanan proxy dmproxy.
  </>,
  <>
    Salin <b>No. Pesanan</b> di bagian bawah detail pesanan.
  </>,
];

export default function HomePage() {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />

      <main id="atas">
        {/* Hero */}
        <section className="relative overflow-hidden border-b-2 border-ink bg-white">
          <DotGrid className="pointer-events-none absolute -top-6 -right-10 size-48 opacity-50" />
          <DotGrid className="pointer-events-none absolute -bottom-8 -left-10 size-40 opacity-40" />

          <div className="relative mx-auto max-w-3xl px-4 py-14 text-center sm:py-20">
            <ServicePill />
            <h1 className="mt-6 font-display leading-[0.95] font-extrabold tracking-tight uppercase">
              <span className="block text-3xl text-ink sm:text-5xl">Proxy cepat untuk</span>
              <span className="block text-5xl text-brand sm:text-7xl">kerja online</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm text-muted sm:text-base">
              Datacenter dan residential, siap pakai hari itu juga. Setiap pesanan dapat dashboard untuk mengecek
              bandwidth, mengganti IP, dan mengatur whitelist sendiri.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href={waOrderGeneralLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("primary", "lg")}
              >
                <WhatsAppIcon className="size-5" /> Pesan langsung
              </a>
              <a href="#harga" className={buttonClass("secondary", "lg")}>
                Lihat harga
              </a>
            </div>
            <p className="mt-3 text-sm font-bold text-ink">
              Pesan langsung ke admin — <span className="text-brand-deep">bebas biaya admin</span>, harga sama.
            </p>
            <p className="mt-1 text-xs text-muted">
              Masih bisa pesan lewat{" "}
              <a
                href={SHOPEE_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-deep hover:underline"
              >
                Shopee
              </a>{" "}
              kalau lebih nyaman.
            </p>

            <FeatureBadges className="mt-8" />
            <p className="mt-4 text-xs font-bold tracking-wide text-muted uppercase">
              Mulai Rp65.000 · masa aktif {MASA_AKTIF_HARI} hari · aktif di hari yang sama
            </p>
          </div>
        </section>

        {/* Keunggulan */}
        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {KEUNGGULAN.map((item) => (
                <div key={item.judul} className="rounded-3xl border-2 border-ink bg-white p-5">
                  <span className="flex size-11 items-center justify-center rounded-full bg-ink text-white">
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
            <div className="flex flex-col gap-5 rounded-3xl border-2 border-ink bg-ink p-6 text-white sm:flex-row sm:items-center sm:p-8">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold tracking-wider text-brand uppercase">Untuk kebutuhan otomatis</p>
                <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight uppercase sm:text-3xl">
                  Paket rotating lewat API
                </h2>
                <p className="mt-2 max-w-xl text-sm text-white/80">
                  Satu alamat API dan kunci rahasia untuk menarik proxy acak dari pool kami — bisa pilih jumlah dan
                  negara, langsung dari script Anda. Batasnya masa aktif dan jumlah permintaan per menit, tanpa
                  menghitung GB.
                </p>
              </div>
              <a
                href={waHelpLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("secondary", "md", "shrink-0")}
              >
                <WhatsAppIcon className="size-4" /> Tanya harga
              </a>
            </div>
          </div>
        </section>

        {/* Cara pesan */}
        <section id="cara-pesan" className="scroll-mt-20 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl leading-tight font-extrabold tracking-tight text-ink uppercase sm:text-4xl">
                Cara <span className="text-brand">pesan</span>
              </h2>
              <p className="mt-3 text-sm text-muted sm:text-base">
                Empat langkah saja. Pesan lewat Shopee juga bisa — nomor pesanan Shopee dipakai untuk membuka
                dashboard yang sama.
              </p>
            </div>

            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {LANGKAH.map((langkah, index) => (
                <li key={langkah.judul} className="rounded-3xl border-2 border-ink bg-white p-5">
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
        <section id="cek-pesanan" className="scroll-mt-20 border-y-2 border-ink bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <Crosses className="justify-center" />
              <h2 className="mt-4 font-display text-3xl leading-tight font-extrabold tracking-tight text-ink uppercase sm:text-4xl">
                Cek <span className="text-brand">pesanan</span>
              </h2>
              <p className="mt-3 text-sm text-muted sm:text-base">
                Sudah membeli? Masukkan nomor pesanan Anda untuk melihat daftar proxy, sisa bandwidth, dan masa
                aktifnya. Punya lebih dari satu pesanan? Buat akun supaya semuanya ada di satu halaman.
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
              <SearchForm />

              <div className="rounded-3xl border-2 border-ink bg-paper p-5">
                <h3 className="font-display text-base font-extrabold tracking-tight text-ink uppercase">
                  Punya beberapa pesanan?
                </h3>
                <p className="mt-2 text-sm text-muted">
                  Buat akun dengan nomor WhatsApp Anda, lalu klaim tiap pesanan memakai kode dari admin — semuanya
                  tampil dalam satu halaman.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/akun/daftar" className={buttonClass("primary", "sm")}>
                    Buat akun
                  </Link>
                  <Link href="/akun/masuk" className={buttonClass("secondary", "sm")}>
                    Masuk
                  </Link>
                </div>

                <h3 className="mt-6 font-display text-base font-extrabold tracking-tight text-ink uppercase">
                  Di mana nomor pesanan?
                </h3>
                <ol className="mt-3 space-y-3">
                  {LETAK_NOMOR.map((langkah, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-ink">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-extrabold text-white">
                        {index + 1}
                      </span>
                      <p className="pt-0.5">{langkah}</p>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
                  Pesan langsung ke admin? Nomor pesanan Anda dikirim lewat chat WhatsApp setelah proxy diaktifkan.
                </p>
              </div>
            </div>
          </div>
        </section>

        <FaqSection />
      </main>

      <footer className="border-t-2 border-ink bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-ink text-white">
              <LogoMark className="size-7" />
            </span>
            <div>
              <p className="font-display text-sm font-extrabold tracking-tight text-ink lowercase">dmproxy</p>
              <p className="text-xs text-muted">Provide EZ Service</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <a href={waOrderGeneralLink()} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "sm")}>
              <WhatsAppIcon className="size-4" /> Pesan langsung
            </a>
            <a href={waHelpLink()} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
              <WhatsAppIcon className="size-4" /> Bantuan
            </a>
            <a href={SHOPEE_STORE_URL} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
              <ShopIcon className="size-4" /> Toko Shopee
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
