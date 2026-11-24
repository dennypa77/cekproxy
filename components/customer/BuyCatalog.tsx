"use client";

import { useState } from "react";
import { createInvoiceAction } from "@/app/account/actions";
import { Modal } from "@/components/Modal";
import { CheckIcon } from "@/components/icons";
import { Badge, Button, buttonClass, cn, inputClass, labelClass } from "@/components/ui";
import { useServerForm } from "@/components/useServerForm";
import { countryName } from "@/lib/format";
import { LOKASI_ACAK, negaraTersedia } from "@/lib/locations";

export interface PaketRow {
  sku: string;
  kategoriId: string;
  kategoriNama: string;
  grupLabel: string;
  /** Paket rotating memakai pool gabungan: tidak ada jumlah IP maupun kuota GB. */
  rotating: boolean;
  ip: number;
  bandwidthLabel: string;
  hargaLabel: string;
  usdLabel: string;
  /** "$0.65 / IP" untuk statis, "$3.17 / day" untuk rotating. */
  perIpLabel: string;
  /** Masa aktif, mis. "30 days". */
  durasiLabel: string;
  populer: boolean;
}

/** Paket statis dan rotating tidak bisa saling menggantikan saat perpanjang. */
function sejenis(a: PaketRow, b: PaketRow): boolean {
  return a.rotating === b.rotating;
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
  skuAwal,
}: {
  paket: PaketRow[];
  metode: MetodeRow[];
  perpanjang: PerpanjangItem[];
  skuAwal: string | null;
}) {
  // Tautan "Order" dari halaman harga membawa ?sku=… → langsung buka dialognya.
  const [pilihan, setPilihan] = useState<Pilihan | null>(
    skuAwal && paket.some((p) => p.sku === skuAwal) ? { sku: skuAwal, extendOrderId: null } : null,
  );

  const statis = paket.filter((p) => !p.rotating);
  const rotating = paket.filter((p) => p.rotating);
  const kategori = [...new Set(statis.map((p) => p.kategoriId))];
  const terpilih = pilihan ? paket.find((p) => p.sku === pilihan.sku) : undefined;

  return (
    <>
      {perpanjang.length > 0 && (
        <section id="renew" className="scroll-mt-6 rounded-3xl border-2 border-ink bg-surface p-5 sm:p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">
            Renew an <span className="text-brand">existing order</span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            Renewing extends the same order — you keep the same IPs, API key, and dashboard.
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
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setPilihan({
                        // Paketnya harus sejenis: pesanan rotating tidak bisa
                        // diperpanjang dengan paket statis, dan sebaliknya.
                        sku: item.skuTebakan ?? (item.rotating ? rotating[0]?.sku : statis[0]?.sku) ?? "",
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
        const rows = statis.filter((p) => p.kategoriId === id);
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

      {rotating.length > 0 && (
        <section id="rotating" className="scroll-mt-6 rounded-3xl border-2 border-ink bg-surface p-5 sm:p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">
            Rotating <span className="text-brand">API</span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            One API key that hands you a fresh proxy from our shared pool on every call. Sold by duration, so there is
            no GB counter to watch. Fair use applies — see the FAQ.
          </p>

          {[...new Set(rotating.map((p) => p.kategoriId))].map((id) => {
            const rows = rotating.filter((p) => p.kategoriId === id);
            return (
              <div key={id} className="mt-5">
                <p className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">
                  {rows[0]?.kategoriNama} pool
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="border-b border-line text-xs tracking-wider text-muted uppercase">
                      <tr>
                        <th className="py-2 pr-3 font-medium">Duration</th>
                        <th className="py-2 pr-3 font-medium">Price</th>
                        <th className="hidden py-2 pr-3 font-medium sm:table-cell">Per day</th>
                        <th className="py-2 text-right font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {rows.map((p) => (
                        <tr key={p.sku} className="transition-colors hover:bg-brand-softer">
                          <td className="py-3 pr-3">
                            <span className="font-display text-base font-extrabold text-ink">{p.durasiLabel}</span>
                            {p.populer && (
                              <span className="ml-2 align-middle">
                                <Badge tone="blue">Best value</Badge>
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-3">
                            <span className="font-display text-base font-extrabold text-ink">{p.usdLabel}</span>
                            <span className="block text-xs text-muted">{p.hargaLabel}</span>
                          </td>
                          <td className="hidden py-3 pr-3 whitespace-nowrap text-muted sm:table-cell">
                            {p.perIpLabel}
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
            );
          })}
        </section>
      )}

      <Modal
        open={Boolean(pilihan && terpilih)}
        title={pilihan?.extendOrderId ? "Renew" : "Checkout"}
        accent={pilihan?.extendOrderId ? "order" : ""}
        lebar="lg"
        onClose={() => setPilihan(null)}
      >
        {pilihan && terpilih && (
          <FormInvoice
            pilihan={pilihan}
            paket={paket}
            terpilih={terpilih}
            metode={metode}
            onCancel={() => setPilihan(null)}
            onGantiSku={(sku) => setPilihan({ ...pilihan, sku })}
          />
        )}
      </Modal>
    </>
  );
}

/**
 * Pemilih lokasi di checkout.
 *
 * Wajib diisi sebelum invoice bisa dibuat. Sebelumnya negara hanya bisa
 * dititipkan di kolom catatan bebas dan sering kosong, jadi admin harus
 * bertanya lewat chat sebelum bisa menyiapkan pesanan.
 *
 * Paket statis: jumlah per negara harus pas dengan jumlah IP paket.
 * Paket rotating: cukup centang negara yang disukai — negara sebenarnya
 * dipilih per panggilan API, jadi tidak ada jumlah yang perlu dibagi.
 */
/**
 * Pemilih lokasi di checkout.
 *
 * Wajib diisi sebelum invoice bisa dibuat. Sebelumnya negara hanya bisa
 * dititipkan di kolom catatan bebas dan sering kosong, jadi admin harus
 * bertanya lewat chat sebelum bisa menyiapkan pesanan.
 *
 * Jumlahnya DIKETIK, bukan hanya tombol +/-. Paket terbesar berisi 1.000 IP,
 * dan menaikkannya satu per satu jelas tidak masuk akal.
 *
 * Daftar negaranya mengikuti kategori paket: stok datacenter dan residential
 * memang berbeda.
 */
function PilihLokasi({
  totalIp,
  rotating,
  kategoriId,
  nilai,
  onChange,
}: {
  totalIp: number;
  rotating: boolean;
  kategoriId: string;
  nilai: string;
  onChange: (nilai: string) => void;
}) {
  const acak = nilai === LOKASI_ACAK;
  const negara = negaraTersedia(kategoriId);

  const rincian = new Map<string, number>();
  if (!acak && nilai) {
    for (const bagian of nilai.split(",")) {
      const [kode, jumlah] = bagian.split(":");
      if (kode) rincian.set(kode, Number.parseInt(jumlah ?? "0", 10) || 0);
    }
  }

  const terpakai = [...rincian.values()].reduce((total, n) => total + n, 0);
  const sisa = totalIp - terpakai;

  const tulis = (peta: Map<string, number>) => {
    const bagian = [...peta.entries()]
      .filter(([, jumlah]) => (rotating ? true : jumlah > 0))
      .map(([kode, jumlah]) => (rotating ? kode : kode + ":" + jumlah));
    onChange(bagian.join(","));
  };

  const setJumlah = (kode: string, jumlah: number) => {
    const peta = new Map(rincian);
    const aman = Math.max(0, Math.min(Number.isFinite(jumlah) ? jumlah : 0, totalIp));
    if (aman === 0) peta.delete(kode);
    else peta.set(kode, aman);
    tulis(peta);
  };

  const togglePilihan = (kode: string) => {
    const peta = new Map(rincian);
    if (peta.has(kode)) peta.delete(kode);
    else peta.set(kode, 0);
    tulis(peta);
  };

  const pesanSisa =
    sisa === 0
      ? "All " + totalIp + " IPs allocated."
      : sisa > 0
        ? sisa + " of " + totalIp + " IPs left to allocate."
        : -sisa + " IPs too many — reduce somewhere.";

  return (
    <fieldset>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <legend className={labelClass}>
          Location {rotating ? "(preferred)" : "(" + totalIp + " IP to allocate)"}
        </legend>
        {!acak && rincian.size > 0 && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs font-bold text-muted underline hover:text-ink"
          >
            Clear
          </button>
        )}
      </div>

      <label
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition-colors",
          acak ? "border-brand bg-brand-softer text-ink" : "border-line bg-surface-2 text-muted hover:border-ink/40",
        )}
      >
        <input
          type="checkbox"
          checked={acak}
          onChange={() => onChange(acak ? "" : LOKASI_ACAK)}
          className="sr-only"
        />
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
            acak ? "border-brand bg-brand text-[#06101c]" : "border-line",
          )}
          aria-hidden="true"
        >
          {acak && <CheckIcon className="size-3" strokeWidth={4} />}
        </span>
        Random — let us pick the best available
      </label>

      {!acak && (
        <>
          {!rotating && (
            <p
              className={cn(
                "mt-3 text-xs font-bold",
                sisa === 0 ? "text-ok" : sisa < 0 ? "text-danger" : "text-muted",
              )}
              aria-live="polite"
            >
              {pesanSisa}
            </p>
          )}

          <div className="mt-2 max-h-72 overflow-y-auto rounded-2xl border-2 border-line bg-surface-2 p-2">
            <div className="grid gap-1.5 sm:grid-cols-2">
              {negara.map((kode) => {
                const jumlah = rincian.get(kode) ?? 0;
                const dipilih = rincian.has(kode);
                return (
                  <div
                    key={kode}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-xl border-2 px-3 py-1.5 text-sm transition-colors",
                      dipilih ? "border-brand bg-brand-softer" : "border-transparent",
                    )}
                  >
                    <span className={cn("truncate font-semibold", dipilih ? "text-ink" : "text-muted")}>
                      {countryName(kode)}
                    </span>

                    {rotating ? (
                      <button
                        type="button"
                        onClick={() => togglePilihan(kode)}
                        className="shrink-0 rounded-full border-2 border-line px-3 py-0.5 text-xs font-bold text-ink hover:border-ink/50"
                      >
                        {dipilih ? "Remove" : "Add"}
                      </button>
                    ) : (
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={totalIp}
                        value={jumlah === 0 ? "" : jumlah}
                        placeholder="0"
                        aria-label={"IPs in " + countryName(kode)}
                        onChange={(event) => setJumlah(kode, Number.parseInt(event.target.value, 10))}
                        className="w-16 shrink-0 rounded-lg border-2 border-line bg-paper px-2 py-1 text-right font-mono text-sm font-bold text-ink focus:border-brand focus:outline-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {rotating && (
            <p className="mt-2 text-xs text-muted">
              You can still request any country per API call — this just tells us which ones to keep stocked for you.
            </p>
          )}
        </>
      )}
    </fieldset>
  );
}

function FormInvoice({
  pilihan,
  paket,
  terpilih,
  metode,
  onCancel,
  onGantiSku,
}: {
  pilihan: Pilihan;
  paket: PaketRow[];
  terpilih: PaketRow;
  metode: MetodeRow[];
  onCancel: () => void;
  onGantiSku: (sku: string) => void;
}) {
  const { pending, onSubmit, formRef } = useServerForm(createInvoiceAction);
  const [metodePilihan, setMetodePilihan] = useState(metode[0]?.kode ?? "");
  const [lokasi, setLokasi] = useState("");

  // Perpanjangan tidak perlu lokasi: pesanannya sudah ada beserta negaranya.
  const perluLokasi = !pilihan.extendOrderId;
  const totalIp = terpilih.rotating ? 0 : terpilih.ip;
  const lokasiSah =
    !perluLokasi ||
    lokasi === LOKASI_ACAK ||
    (terpilih.rotating
      ? lokasi.length > 0
      : lokasi
          .split(",")
          .filter(Boolean)
          .reduce((total, bagian) => total + (Number.parseInt(bagian.split(":")[1] ?? "0", 10) || 0), 0) === totalIp);

  const blokPaket = pilihan.extendOrderId ? (
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
        {paket
          .filter((p) => sejenis(p, terpilih))
          .map((p) => (
            <option key={p.sku} value={p.sku}>
              {p.rotating
                ? p.kategoriNama + " Rotating · " + p.durasiLabel
                : p.kategoriNama + " · " + p.ip + " IP · " + p.bandwidthLabel}{" "}
              — {p.usdLabel}
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
        {terpilih.rotating
          ? terpilih.kategoriNama + " Rotating API"
          : terpilih.kategoriNama + " · " + terpilih.ip + " IP · " + terpilih.bandwidthLabel}
      </p>
      <p className="mt-1 text-sm text-muted">
        {terpilih.durasiLabel}
        {terpilih.rotating ? " · shared pool, one API key" : " plan"}
      </p>
    </div>
  );

  const blokBayar = (
    <>
      <div className="flex items-baseline justify-between rounded-2xl border-2 border-line bg-surface-2 px-4 py-3">
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
                metodePilihan === m.kode
                  ? "border-brand bg-brand-softer text-ink"
                  : "border-line bg-surface-2 text-muted hover:border-ink/40",
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
        <input
          id="catatan"
          name="catatan"
          maxLength={300}
          className={inputClass}
          placeholder="e.g. a city, or anything else we should know"
        />
      </div>

      <p className="text-xs text-muted">
        We&apos;ll show you an exact amount to transfer, down to the last 3 digits — that is how we match your payment.
      </p>

      <div className="flex gap-2">
        <Button type="submit" loading={pending} disabled={!lokasiSah} className="flex-1">
          Create invoice
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </>
  );

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="sku" value={pilihan.sku} />
      {pilihan.extendOrderId && <input type="hidden" name="extend_order_id" value={pilihan.extendOrderId} />}
      {perluLokasi && <input type="hidden" name="lokasi" value={lokasi} />}

      {pilihan.extendOrderId && (
        <p className="rounded-2xl border-2 border-line bg-surface-2 p-3 text-sm text-muted">
          Renewing order <span className="font-mono font-bold text-ink">{pilihan.orderNo}</span> — we add{" "}
          {terpilih.durasiLabel} to its current expiry date.
        </p>
      )}

      {/* Dua kolom hanya saat ada pemilihan lokasi; perpanjangan tidak punya
          isi sebanyak itu dan akan terlihat kosong sebelah. */}
      {perluLokasi ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {blokPaket}
            <PilihLokasi
              totalIp={totalIp}
              rotating={terpilih.rotating}
              kategoriId={terpilih.kategoriId}
              nilai={lokasi}
              onChange={setLokasi}
            />
          </div>
          <div className="space-y-4">{blokBayar}</div>
        </div>
      ) : (
        <div className="space-y-4">
          {blokPaket}
          {blokBayar}
        </div>
      )}
    </form>
  );
}
