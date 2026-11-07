"use client";

import { useState } from "react";
import { createInvoiceAction } from "@/app/account/actions";
import { Modal } from "@/components/Modal";
import { CheckIcon } from "@/components/icons";
import { Badge, Button, buttonClass, cn, inputClass, labelClass } from "@/components/ui";
import { useServerForm } from "@/components/useServerForm";

export interface PaketRow {
  sku: string;
  kategoriId: string;
  kategoriNama: string;
  grupLabel: string;
  ip: number;
  bandwidthLabel: string;
  hargaLabel: string;
  usdLabel: string;
  perIpLabel: string;
  populer: boolean;
}

export interface MetodeRow {
  kode: string;
  nama: string;
}

export interface PerpanjangItem {
  orderId: string;
  orderNo: string;
  expiresLabel: string;
  rotating: boolean;
  skuTebakan: string | null;
  invoiceBerjalan: string | null;
}

interface Pilihan {
  sku: string;
  extendOrderId: string | null;
  orderNo?: string;
}

export function BuyCatalog({
  paket,
  metode,
  perpanjang,
  masaAktifHari,
  skuAwal,
}: {
  paket: PaketRow[];
  metode: MetodeRow[];
  perpanjang: PerpanjangItem[];
  masaAktifHari: number;
  skuAwal: string | null;
}) {
  // Tautan "Order" dari halaman harga membawa ?sku=… → langsung buka dialognya.
  const [pilihan, setPilihan] = useState<Pilihan | null>(
    skuAwal && paket.some((p) => p.sku === skuAwal) ? { sku: skuAwal, extendOrderId: null } : null,
  );

  const kategori = [...new Set(paket.map((p) => p.kategoriId))];
  const terpilih = pilihan ? paket.find((p) => p.sku === pilihan.sku) : undefined;

  return (
    <>
      {perpanjang.length > 0 && (
        <section id="renew" className="scroll-mt-6 rounded-3xl border-2 border-ink bg-surface p-5 sm:p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">
            Renew an <span className="text-brand">existing order</span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            Renewing adds {masaAktifHari} more days to the same order — you keep the same IPs and dashboard.
          </p>

          <ul className="mt-4 divide-y divide-line">
            {perpanjang.map((item) => (
              <li key={item.orderId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold break-all text-ink">{item.orderNo}</p>
                  <p className="text-xs text-muted">Active until {item.expiresLabel}</p>
                </div>
                {item.invoiceBerjalan ? (
                  <a href={`/account/invoice/${encodeURIComponent(item.invoiceBerjalan)}`} className={buttonClass("secondary", "sm")}>
                    Open invoice {item.invoiceBerjalan}
                  </a>
                ) : item.rotating ? (
                  <span className="text-xs font-semibold text-muted">Renew rotating plans over WhatsApp</span>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setPilihan({
                        sku: item.skuTebakan ?? paket[0]?.sku ?? "",
                        extendOrderId: item.orderId,
                        orderNo: item.orderNo,
                      })
                    }
                  >
                    Renew →
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {kategori.map((id) => {
        const rows = paket.filter((p) => p.kategoriId === id);
        const grup = [...new Set(rows.map((p) => p.grupLabel))];
        return (
          <section key={id} className="rounded-3xl border-2 border-ink bg-surface p-5 sm:p-6">
            <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">
              {rows[0]?.kategoriNama} <span className="text-brand">proxies</span>
            </h2>

            {grup.map((label) => (
              <div key={label} className="mt-5">
                <p className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">{label}</p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="border-b border-line text-xs tracking-wider text-muted uppercase">
                      <tr>
                        <th className="py-2 pr-3 font-medium">IP count</th>
                        <th className="py-2 pr-3 font-medium">Bandwidth</th>
                        <th className="py-2 pr-3 font-medium">Price</th>
                        <th className="hidden py-2 pr-3 font-medium sm:table-cell">Per IP</th>
                        <th className="py-2 text-right font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {rows
                        .filter((p) => p.grupLabel === label)
                        .map((p) => (
                          <tr key={p.sku} className="transition-colors hover:bg-brand-softer">
                            <td className="py-3 pr-3">
                              <span className="font-display text-base font-extrabold text-ink">{p.ip} IP</span>
                              {p.populer && (
                                <span className="ml-2 align-middle">
                                  <Badge tone="blue">Best seller</Badge>
                                </span>
                              )}
                            </td>
                            <td className="py-3 pr-3 whitespace-nowrap text-muted">{p.bandwidthLabel}</td>
                            <td className="py-3 pr-3">
                              <span className="font-display text-base font-extrabold text-ink">{p.usdLabel}</span>
                              <span className="block text-xs text-muted">{p.hargaLabel}</span>
                            </td>
                            <td className="hidden py-3 pr-3 whitespace-nowrap text-muted sm:table-cell">
                              ≈{p.perIpLabel} / IP
                            </td>
                            <td className="py-3 text-right">
                              <Button size="sm" onClick={() => setPilihan({ sku: p.sku, extendOrderId: null })}>
                                Buy
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>
        );
      })}

      <Modal
        open={Boolean(pilihan && terpilih)}
        title={pilihan?.extendOrderId ? "Renew" : "Checkout"}
        accent={pilihan?.extendOrderId ? "order" : ""}
        onClose={() => setPilihan(null)}
      >
        {pilihan && terpilih && (
          <FormInvoice
            pilihan={pilihan}
            paket={paket}
            terpilih={terpilih}
            metode={metode}
            masaAktifHari={masaAktifHari}
            onCancel={() => setPilihan(null)}
            onGantiSku={(sku) => setPilihan({ ...pilihan, sku })}
          />
        )}
      </Modal>
    </>
  );
}

function FormInvoice({
  pilihan,
  paket,
  terpilih,
  metode,
  masaAktifHari,
  onCancel,
  onGantiSku,
}: {
  pilihan: Pilihan;
  paket: PaketRow[];
  terpilih: PaketRow;
  metode: MetodeRow[];
  masaAktifHari: number;
  onCancel: () => void;
  onGantiSku: (sku: string) => void;
}) {
  const { pending, onSubmit, formRef } = useServerForm(createInvoiceAction);
  const [metodePilihan, setMetodePilihan] = useState(metode[0]?.kode ?? "");

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="sku" value={pilihan.sku} />
      {pilihan.extendOrderId && <input type="hidden" name="extend_order_id" value={pilihan.extendOrderId} />}

      {pilihan.extendOrderId && (
        <p className="rounded-2xl border-2 border-line bg-surface-2 p-3 text-sm text-muted">
          Renewing order <span className="font-mono font-bold text-ink">{pilihan.orderNo}</span> — we add{" "}
          {masaAktifHari} days to its current expiry date.
        </p>
      )}

      {pilihan.extendOrderId ? (
        <div>
          <label className={labelClass} htmlFor="sku-pilih">
            Plan
          </label>
          <select
            id="sku-pilih"
            className={inputClass}
            value={pilihan.sku}
            onChange={(event) => onGantiSku(event.target.value)}
          >
            {paket.map((p) => (
              <option key={p.sku} value={p.sku}>
                {p.kategoriNama} · {p.ip} IP · {p.bandwidthLabel} — {p.usdLabel}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted">
            Pre-selected from your current order. Change it if you want a different size.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-line bg-surface-2 p-4">
          <p className="font-display text-base font-extrabold text-ink">
            {terpilih.kategoriNama} · {terpilih.ip} IP · {terpilih.bandwidthLabel}
          </p>
          <p className="mt-1 text-sm text-muted">{masaAktifHari}-day plan</p>
        </div>
      )}

      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <span className="text-xs font-bold tracking-wider text-muted uppercase">Price</span>
        <span className="text-right">
          <span className="font-display text-2xl font-extrabold text-ink">{terpilih.usdLabel}</span>
          <span className="block text-xs text-muted">{terpilih.hargaLabel}</span>
        </span>
      </div>

      <fieldset>
        <legend className={labelClass}>Payment method</legend>
        <div className="grid gap-2">
          {metode.map((m) => (
            <label
              key={m.kode}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition-colors",
                metodePilihan === m.kode ? "border-brand bg-brand-softer text-ink" : "border-line bg-surface-2 text-muted hover:border-ink/40",
              )}
            >
              <input
                type="radio"
                name="metode"
                value={m.kode}
                checked={metodePilihan === m.kode}
                onChange={() => setMetodePilihan(m.kode)}
                className="sr-only"
              />
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                  metodePilihan === m.kode ? "border-brand bg-brand text-[#06101c]" : "border-line",
                )}
                aria-hidden="true"
              >
                {metodePilihan === m.kode && <CheckIcon className="size-3" strokeWidth={4} />}
              </span>
              {m.nama}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className={labelClass} htmlFor="catatan">
          Note for us (optional)
        </label>
        <input id="catatan" name="catatan" maxLength={300} className={inputClass} placeholder="e.g. preferred country" />
      </div>

      <p className="text-xs text-muted">
        We&apos;ll show you an exact amount to transfer, down to the last 3 digits — that is how we match your payment.
      </p>

      <div className="flex gap-2">
        <Button type="submit" loading={pending} className="flex-1">
          Create invoice
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
