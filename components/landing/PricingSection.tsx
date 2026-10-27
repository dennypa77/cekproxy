import { CheckIcon, ShopIcon, WhatsAppIcon } from "@/components/icons";
import { Badge, buttonClass } from "@/components/ui";
import { SHOPEE_STORE_URL, waOrderLink } from "@/lib/links";
import { hargaPerIp, KATEGORI_HARGA, labelBandwidth, MASA_AKTIF_HARI, rupiah, type Paket } from "@/lib/pricing";

function KartuPaket({ paket, kategori }: { paket: Paket; kategori: string }) {
  return (
    <div className="relative flex flex-col rounded-3xl border-2 border-ink bg-white p-5">
      {paket.populer && (
        <span className="absolute -top-3 left-5">
          <Badge tone="blue">Paling laris</Badge>
        </span>
      )}

      <p className="font-display text-4xl leading-none font-extrabold text-ink">
        {paket.ip} <span className="text-2xl">IP</span>
      </p>
      <p className="mt-1 text-sm font-bold tracking-wide text-muted uppercase">
        Bandwidth {labelBandwidth(paket.bandwidthGb)}
      </p>

      <div className="my-4 rounded-2xl bg-brand-softer p-4">
        <p className="font-display text-3xl font-extrabold text-ink">{rupiah(paket.hargaRp)}</p>
        <p className="text-xs font-semibold text-muted">
          masa aktif {MASA_AKTIF_HARI} hari · ±{hargaPerIp(paket)} per IP
        </p>
      </div>

      <div className="mt-auto space-y-2">
        <a
          href={waOrderLink({ kategori, ip: paket.ip, bandwidthGb: paket.bandwidthGb, harga: rupiah(paket.hargaRp) })}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("primary", "md", "w-full")}
        >
          <WhatsAppIcon className="size-4" /> Pesan langsung
        </a>
        <a
          href={SHOPEE_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-muted transition-colors hover:text-ink"
        >
          <ShopIcon className="size-3.5" /> atau pesan lewat Shopee
        </a>
      </div>
    </div>
  );
}

const TERMASUK = [
  "Dashboard cek bandwidth & daftar IP",
  "Ganti IP (replace) sesuai kuota",
  "Atur IP whitelist sendiri",
  "Pilih negara saat ganti IP",
];

export function PricingSection() {
  return (
    <section id="harga" className="scroll-mt-20 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl leading-tight font-extrabold tracking-tight text-ink uppercase sm:text-4xl">
            Pilih <span className="text-brand">paket</span> Anda
          </h2>
          <p className="mt-3 text-sm text-muted sm:text-base">
            Harga sudah termasuk dashboard pengelolaan. Pesan langsung ke admin lewat WhatsApp supaya tidak kena
            biaya admin marketplace — harganya sama persis dengan di Shopee.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Badge tone="green">Bebas biaya admin</Badge>
            <Badge tone="blue">Harga sama dengan Shopee</Badge>
            <Badge>Bisa tetap pesan lewat Shopee</Badge>
          </div>
        </div>

        {KATEGORI_HARGA.map((kategori) => (
          <div key={kategori.id} id={kategori.id} className="mt-12 scroll-mt-20 first:mt-10">
            <div className="flex flex-col gap-3 border-b-2 border-ink pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="font-display text-2xl font-extrabold tracking-tight text-ink uppercase">
                  Proxy {kategori.nama}
                </h3>
                <p className="mt-1 max-w-xl text-sm text-muted">{kategori.ringkasan}</p>
              </div>
              <ul className="flex flex-wrap gap-2">
                {kategori.cocokUntuk.map((item) => (
                  <li key={item}>
                    <Badge>{item}</Badge>
                  </li>
                ))}
              </ul>
            </div>

            {kategori.grup.map((grup) => (
              <div key={grup.label} className="mt-6">
                <p className="mb-3 text-xs font-bold tracking-wider text-muted uppercase">{grup.label}</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {grup.paket.map((paket) => (
                    <KartuPaket key={`${paket.ip}-${paket.bandwidthGb}`} paket={paket} kategori={kategori.nama} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className="mt-10 rounded-3xl border-2 border-ink bg-white p-5 sm:p-6">
          <p className="mb-3 text-xs font-bold tracking-wider text-muted uppercase">Semua paket sudah termasuk</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {TERMASUK.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-ink">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-ok-soft">
                  <CheckIcon className="size-3.5" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
