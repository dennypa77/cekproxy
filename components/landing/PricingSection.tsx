import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { OrderButton, RotatingOrderButton } from "@/components/landing/OrderButton";
import { Badge, buttonClass } from "@/components/ui";
import { checkoutEnabled } from "@/lib/env";
import { isiVar } from "@/lib/i18n";
import { kamus, type Kamus } from "@/lib/kamus";
import { waOrderGeneralLink } from "@/lib/links";
import {
  KATEGORI_HARGA,
  labelBandwidth,
  labelDurasi,
  MASA_AKTIF_HARI,
  PAKET_ROTATING,
  ROTATING_FAIR_USE_GB,
  rupiah,
  usd,
  usdPerHari,
  usdPerIp,
  type Paket,
} from "@/lib/pricing";


async function BarisPaket({ paket, kategori }: { paket: Paket; kategori: string }) {
  const k = await kamus();
  return (
    <tr className="transition-colors hover:bg-brand-softer">
      <td className="py-3 pr-3">
        <span className="font-display text-lg font-extrabold text-ink">{paket.ip} IP</span>
        {paket.populer && (
          <span className="ml-2 align-middle">
            <Badge tone="blue">{k.harga.palingLaris}</Badge>
          </span>
        )}
      </td>
      <td className="py-3 pr-3 whitespace-nowrap text-muted">{labelBandwidth(paket.bandwidthGb)}</td>
      <td className="py-3 pr-3">
        <span className="font-display text-lg font-extrabold text-ink">{usd(paket.hargaRp)}</span>
        <span className="block text-xs text-muted">
          {rupiah(paket.hargaRp)} · {isiVar(k.harga.labelMasaAktif, { hari: MASA_AKTIF_HARI })}
        </span>
      </td>
      <td className="hidden py-3 pr-3 whitespace-nowrap text-muted sm:table-cell">≈{usdPerIp(paket)} / IP</td>
      <td className="py-3 text-right">
        <OrderButton paket={paket} kategori={kategori} />
      </td>
    </tr>
  );
}

/**
 * Paket rotating dijual per durasi, bukan per bandwidth: pemakaian tiap
 * customer tidak bisa diukur karena proxy-nya dipakai langsung ke penyedia.
 * Karena itu tabelnya pun tidak punya kolom IP maupun bandwidth.
 */
async function TabelRotating() {
  const k = await kamus();
  const kategori = [...new Set(PAKET_ROTATING.map((p) => p.kategoriId))];

  return (
    <div id="rotating" className="mt-12 scroll-mt-20">
      <div className="flex flex-col gap-3 border-b-2 border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-display text-2xl font-extrabold tracking-tight text-ink uppercase">
            {k.harga.rotatingJudulAwal} {k.harga.rotatingJudul}
          </h3>
          <p className="mt-1 max-w-xl text-sm text-muted">
            {isiVar(k.harga.rotatingIsi, { gb: ROTATING_FAIR_USE_GB })}
          </p>
        </div>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Badge>{k.harga.rotatingBadge[0]}</Badge>
          </li>
          <li>
            <Badge>{k.harga.rotatingBadge[1]}</Badge>
          </li>
          <li>
            <Badge>Instant API key</Badge>
          </li>
        </ul>
      </div>

      {kategori.map((id) => {
        const rows = PAKET_ROTATING.filter((p) => p.kategoriId === id);
        return (
          <div key={id} className="mt-6">
            <p className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">{rows[0]?.kategoriNama} {k.harga.poolSuffix}</p>
            <div className="overflow-x-auto rounded-3xl border-2 border-line bg-surface px-4 sm:px-5">
              <table className="w-full min-w-[460px] text-left text-sm">
                <thead className="border-b border-line text-xs tracking-wider text-muted uppercase">
                  <tr>
                    <th className="py-3 pr-3 font-medium">{k.harga.kolom.durasi}</th>
                    <th className="py-3 pr-3 font-medium">{k.harga.kolom.harga}</th>
                    <th className="hidden py-3 pr-3 font-medium sm:table-cell">{k.harga.kolom.perHari}</th>
                    <th className="py-3 text-right font-medium">{k.harga.kolom.aksi}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((paket) => (
                    <tr key={paket.sku} className="transition-colors hover:bg-brand-softer">
                      <td className="py-3 pr-3">
                        <span className="font-display text-lg font-extrabold text-ink">{labelDurasi(paket.hari)}</span>
                        {paket.populer && (
                          <span className="ml-2 align-middle">
                            <Badge tone="blue">{k.harga.palingHemat}</Badge>
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="font-display text-lg font-extrabold text-ink">{usd(paket.hargaRp)}</span>
                        <span className="block text-xs text-muted">{rupiah(paket.hargaRp)}</span>
                      </td>
                      <td className="hidden py-3 pr-3 whitespace-nowrap text-muted sm:table-cell">
                        {usdPerHari(paket)} / day
                      </td>
                      <td className="py-3 text-right">
                        <RotatingOrderButton paket={paket} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Ringkasan & badge kategori ikut bahasa; nama kategorinya tetap. */
function teksKategori(k: Kamus, id: string) {
  const peta: Record<string, { ringkasan: string; cocokUntuk: string[] }> = k.harga.kategori;
  return peta[id] ?? { ringkasan: "", cocokUntuk: [] };
}

export async function PricingSection() {
  const k = await kamus();
  return (
    <section id="pricing" className="scroll-mt-20 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl leading-tight font-extrabold tracking-tight text-ink uppercase sm:text-4xl">
            {k.harga.judul} <span className="text-brand">{k.harga.judulAksen}</span>
          </h2>
          <p className="mt-3 text-sm text-muted sm:text-base">
            {checkoutEnabled() ? k.harga.ringkasCheckout : k.harga.ringkasWa}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Badge tone="green">{k.harga.tanpaBiaya}</Badge>
            <Badge tone="blue">{k.harga.aktifHariSama}</Badge>
          </div>
        </div>

        {KATEGORI_HARGA.map((kategori) => (
          <div key={kategori.id} id={kategori.id} className="mt-12 scroll-mt-20 first:mt-10">
            <div className="flex flex-col gap-3 border-b-2 border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="font-display text-2xl font-extrabold tracking-tight text-ink uppercase">
                  {kategori.nama} proxies
                </h3>
                <p className="mt-1 max-w-xl text-sm text-muted">{teksKategori(k, kategori.id).ringkasan}</p>
              </div>
              <ul className="flex flex-wrap gap-2">
                {teksKategori(k, kategori.id).cocokUntuk.map((item) => (
                  <li key={item}>
                    <Badge>{item}</Badge>
                  </li>
                ))}
              </ul>
            </div>

            {kategori.grup.map((grup) => (
              <div key={grup.label} className="mt-6">
                <p className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">{grup.label}</p>
                <div className="overflow-x-auto rounded-3xl border-2 border-line bg-surface px-4 sm:px-5">
                  <table className="w-full min-w-[460px] text-left text-sm">
                    <thead className="border-b border-line text-xs tracking-wider text-muted uppercase">
                      <tr>
                        <th className="py-3 pr-3 font-medium">{k.harga.kolom.jumlahIp}</th>
                        <th className="py-3 pr-3 font-medium">{k.harga.kolom.bandwidth}</th>
                        <th className="py-3 pr-3 font-medium">{k.harga.kolom.harga}</th>
                        <th className="hidden py-3 pr-3 font-medium sm:table-cell">{k.harga.kolom.perIp}</th>
                        <th className="py-3 text-right font-medium">{k.harga.kolom.aksi}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {grup.paket.map((paket) => (
                        <BarisPaket key={paket.sku} paket={paket} kategori={kategori.nama} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ))}

        <TabelRotating />

        <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="rounded-3xl border-2 border-line bg-surface p-5 sm:p-6">
            <p className="mb-3 text-xs font-bold tracking-wider text-muted uppercase">{k.harga.termasukJudul}</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {k.harga.termasuk.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-ink">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok">
                    <CheckIcon className="size-3.5" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2 lg:flex-col">
            <a
              href={waOrderGeneralLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("secondary", "sm")}
            >
              <WhatsAppIcon className="size-4" /> Ask us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
