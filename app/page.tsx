import { Crosses, FeatureBadges, LogoTab, ServicePill } from "@/components/Brand";
import { SearchForm } from "@/components/customer/SearchForm";
import { Decor } from "@/components/Decor";
import { ShopIcon, WhatsAppIcon } from "@/components/icons";
import { SHOPEE_STORE_URL, waHelpLink } from "@/lib/links";

const STEPS = [
  <>
    Buka aplikasi Shopee, pilih menu <b>Saya</b>.
  </>,
  <>
    Masuk ke <b>Pesanan Saya</b>, pilih pesanan proxy DM Digital.
  </>,
  <>
    Salin <b>No. Pesanan</b> di bagian bawah detail pesanan.
  </>,
];

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-10">
      <Decor />

      <div className="flex items-start justify-between">
        <Crosses className="mt-6" />
        <LogoTab />
      </div>

      <header className="mt-6 mb-8 text-center">
        <h1 className="font-display leading-[0.95] font-extrabold tracking-tight uppercase">
          <span className="block text-2xl text-ink sm:text-3xl">Cek Status</span>
          <span className="block text-6xl text-brand sm:text-7xl">Proxy</span>
        </h1>
        <p className="mt-4 text-sm font-bold tracking-wide text-ink uppercase">Bandwidth · Daftar IP · Replace · Whitelist</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Cukup masukkan nomor pesanan Shopee Anda, tanpa perlu login.
        </p>
      </header>

      <SearchForm />

      <FeatureBadges className="mt-6" />

      <section className="mt-10 rounded-3xl border-2 border-ink bg-white p-5 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-extrabold tracking-tight uppercase">
          Di mana <span className="text-brand">nomor pesanan?</span>
        </h2>
        <ol className="space-y-3">
          {STEPS.map((step, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-ink">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-extrabold text-white">
                {index + 1}
              </span>
              <p className="pt-1">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-auto flex flex-col items-center gap-4 pt-12 text-sm">
        <ServicePill />
        <div className="flex flex-wrap justify-center gap-2">
          <a
            href={waHelpLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1.5 font-semibold text-ink transition hover:bg-brand-softer"
          >
            <WhatsAppIcon className="size-4" /> Bantuan WhatsApp
          </a>
          <a
            href={SHOPEE_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1.5 font-semibold text-ink transition hover:bg-brand-softer"
          >
            <ShopIcon className="size-4" /> Toko Shopee
          </a>
        </div>
      </footer>
    </main>
  );
}
