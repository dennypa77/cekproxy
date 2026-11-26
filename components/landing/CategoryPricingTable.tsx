import { OrderButton } from "@/components/landing/OrderButton";
import { Badge } from "@/components/ui";
import { isiVar } from "@/lib/i18n";
import { kamus } from "@/lib/kamus";
import {
  labelBandwidth,
  MASA_AKTIF_HARI,
  rupiah,
  usd,
  usdPerIp,
  type KategoriHarga,
} from "@/lib/pricing";

/** Pricing table for a single category, used on product landing pages. */
export async function CategoryPricingTable({ kategori }: { kategori: KategoriHarga }) {
  const k = await kamus();
  return (
    <div>
      {kategori.grup.map((grup) => (
        <div key={grup.label} className="mt-6 first:mt-0">
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
                  <tr key={paket.sku} className="transition-colors hover:bg-brand-softer">
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
                    <td className="hidden py-3 pr-3 whitespace-nowrap text-muted sm:table-cell">
                      ≈{usdPerIp(paket)} / IP
                    </td>
                    <td className="py-3 text-right">
                      <OrderButton paket={paket} kategori={kategori.nama} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
