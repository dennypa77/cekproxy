import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { OrderButton } from "@/components/landing/OrderButton";
import { Badge, buttonClass } from "@/components/ui";
import { waOrderGeneralLink } from "@/lib/links";
import {
  KATEGORI_HARGA,
  labelBandwidth,
  MASA_AKTIF_HARI,
  rupiah,
  usd,
  usdPerIp,
  type Paket,
} from "@/lib/pricing";

const TERMASUK = [
  "Dashboard to track bandwidth & IP list",
  "Replace IPs within your quota",
  "Manage your own IP whitelist",
  "Pick a country when replacing IPs",
];

function BarisPaket({ paket, kategori }: { paket: Paket; kategori: string }) {
  return (
    <tr className="transition-colors hover:bg-brand-softer">
      <td className="py-3 pr-3">
        <span className="font-display text-lg font-extrabold text-ink">{paket.ip} IP</span>
        {paket.populer && (
          <span className="ml-2 align-middle">
            <Badge tone="blue">Best seller</Badge>
          </span>
        )}
      </td>
      <td className="py-3 pr-3 whitespace-nowrap text-muted">{labelBandwidth(paket.bandwidthGb)}</td>
      <td className="py-3 pr-3">
        <span className="font-display text-lg font-extrabold text-ink">{usd(paket.hargaRp)}</span>
        <span className="block text-xs text-muted">
          {rupiah(paket.hargaRp)} · {MASA_AKTIF_HARI}-day plan
        </span>
      </td>
      <td className="hidden py-3 pr-3 whitespace-nowrap text-muted sm:table-cell">≈{usdPerIp(paket)} / IP</td>
      <td className="py-3 text-right">
        <OrderButton paket={paket} kategori={kategori} />
      </td>
    </tr>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-20 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl leading-tight font-extrabold tracking-tight text-ink uppercase sm:text-4xl">
            Choose your <span className="text-brand">plan</span>
          </h2>
          <p className="mt-3 text-sm text-muted sm:text-base">
            Order online: create an account, pick a plan, and check out. Every price already includes the management
            dashboard. Prices shown in USD (IDR also listed).
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Badge tone="green">No service fee</Badge>
            <Badge tone="blue">Same-day activation</Badge>
          </div>
        </div>

        {KATEGORI_HARGA.map((kategori) => (
          <div key={kategori.id} id={kategori.id} className="mt-12 scroll-mt-20 first:mt-10">
            <div className="flex flex-col gap-3 border-b-2 border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="font-display text-2xl font-extrabold tracking-tight text-ink uppercase">
                  {kategori.nama} proxies
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
                <p className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">{grup.label}</p>
                <div className="overflow-x-auto rounded-3xl border-2 border-line bg-surface px-4 sm:px-5">
                  <table className="w-full min-w-[460px] text-left text-sm">
                    <thead className="border-b border-line text-xs tracking-wider text-muted uppercase">
                      <tr>
                        <th className="py-3 pr-3 font-medium">IP count</th>
                        <th className="py-3 pr-3 font-medium">Bandwidth</th>
                        <th className="py-3 pr-3 font-medium">Price</th>
                        <th className="hidden py-3 pr-3 font-medium sm:table-cell">Per IP</th>
                        <th className="py-3 text-right font-medium">Action</th>
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

        <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="rounded-3xl border-2 border-line bg-surface p-5 sm:p-6">
            <p className="mb-3 text-xs font-bold tracking-wider text-muted uppercase">Every plan includes</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {TERMASUK.map((item) => (
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
