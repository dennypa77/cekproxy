"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cancelInvoiceAction, markInvoicePaidAction } from "@/app/account/actions";
import { AlertIcon, CheckIcon, ClockIcon, CopyIcon } from "@/components/icons";
import { Button, cn } from "@/components/ui";
import { useServerForm } from "@/components/useServerForm";
import { copyText } from "@/lib/client/clipboard";

export interface InvoiceView {
  invoiceNo: string;
  status: "menunggu_bayar" | "menunggu_verifikasi" | "disetujui" | "ditolak" | "kedaluwarsa" | "dibatalkan";
  paketNama: string;
  jenisPerpanjangan: boolean;
  masaAktifHari: number;
  /** Nominal persis yang harus ditransfer, sudah termasuk 3 digit unik. */
  totalRp: number;
  totalLabel: string;
  /** Nilai setara dalam USD — hanya informasi, yang dibayar tetap rupiah. */
  usdLabel: string;
  hargaLabel: string;
  kodeUnik: number;
  expiresAt: string;
  alasanTolak: string | null;
  orderNo: string | null;
}

export interface MetodeView {
  kode: string;
  nama: string;
  nomor: string | null;
  atasNama: string;
  gambar?: string;
  petunjuk: string;
}

/** Sisa waktu bayar, dihitung ulang di browser supaya tidak ikut cache halaman. */
function useHitungMundur(expiresAt: string): { label: string; habis: boolean } {
  const [sisa, setSisa] = useState(() => Math.max(0, new Date(expiresAt).getTime() - Date.now()));

  useEffect(() => {
    const tick = () => setSisa(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const detik = Math.floor(sisa / 1000);
  const jam = Math.floor(detik / 3600);
  const menit = Math.floor((detik % 3600) / 60);
  const dtk = detik % 60;
  return {
    label: `${String(jam).padStart(2, "0")}:${String(menit).padStart(2, "0")}:${String(dtk).padStart(2, "0")}`,
    habis: sisa <= 0,
  };
}

function Salin({ nilai, label }: { nilai: string; label: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        const berhasil = await copyText(nilai);
        if (berhasil) toast.success(`${label} copied`);
        else toast.error("Could not copy — please copy it by hand");
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-ink/45 bg-surface px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:border-brand hover:bg-brand-softer"
    >
      <CopyIcon className="size-3.5" /> Copy
    </button>
  );
}

const LANGKAH = [
  { judul: "Confirmation received", detail: "1–3 minutes", selesaiPada: 1 },
  { judul: "We check the payment", detail: "by hand, no payment gateway", selesaiPada: 2 },
  { judul: "Proxies activated", detail: "usually within 0–2 hours", selesaiPada: 3 },
];

export function InvoicePanel({ invoice, metode }: { invoice: InvoiceView; metode: MetodeView | null }) {
  const { label, habis } = useHitungMundur(invoice.expiresAt);
  const menungguBayar = invoice.status === "menunggu_bayar" && !habis;
  const sudahLapor = invoice.status === "menunggu_verifikasi";

  const bayar = useServerForm(markInvoicePaidAction);
  const batal = useServerForm(cancelInvoiceAction);

  return (
    <div className="space-y-5">
      {/* Nominal: bagian terpenting halaman ini. */}
      <section className="rounded-3xl border-2 border-ink bg-surface p-5 sm:p-6">
        <p className="text-xs font-bold tracking-wider text-muted uppercase">
          {menungguBayar ? "Transfer exactly" : "Invoice amount"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="font-display text-4xl leading-none font-extrabold tracking-tight text-ink tabular-nums sm:text-5xl">
            {invoice.totalLabel}
          </span>
          <Salin nilai={String(invoice.totalRp)} label="Amount" />
        </div>
        <p className="mt-1 text-sm text-muted">
          ≈{invoice.usdLabel} — billed in Indonesian rupiah, so send the rupiah amount above.
        </p>

        <p className="mt-3 flex items-start gap-2 rounded-2xl border-2 border-warn/40 bg-warn-soft p-3 text-sm text-ink">
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            Send the amount <b>exactly</b>, including the last 3 digits (<b>{invoice.kodeUnik}</b>). That is how we
            recognise your payment — a rounded amount can&apos;t be matched automatically.
          </span>
        </p>

        <dl className="mt-4 grid gap-2 border-t border-line pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold tracking-wider text-muted uppercase">Plan</dt>
            <dd className="text-ink">
              {invoice.paketNama}
              {invoice.jenisPerpanjangan && " (renewal)"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-wider text-muted uppercase">Duration</dt>
            <dd className="text-ink">{invoice.masaAktifHari} days</dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-wider text-muted uppercase">Plan price</dt>
            <dd className="text-ink">{invoice.hargaLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-wider text-muted uppercase">Unique code</dt>
            <dd className="text-ink">+{invoice.kodeUnik}</dd>
          </div>
        </dl>

        {menungguBayar && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-line bg-surface-2 px-4 py-1.5 text-sm font-bold text-ink tabular-nums">
            <ClockIcon className="size-4" /> {label} left to pay
          </p>
        )}
      </section>

      {/* Rekening hanya tampil selama invoice memang masih perlu dibayar. */}
      {menungguBayar && metode && (
        <section className="rounded-3xl border-2 border-ink bg-surface p-5 sm:p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">
            Pay with <span className="text-brand">{metode.nama}</span>
          </h2>
          <p className="mt-1 text-sm text-muted">{metode.petunjuk}</p>

          {metode.gambar ? (
            <div className="mt-4 flex justify-center">
              <div className="rounded-2xl bg-white p-3">
                <Image
                  src={metode.gambar}
                  alt={`QRIS ${metode.atasNama}`}
                  width={320}
                  height={420}
                  className="h-auto w-[260px] sm:w-[320px]"
                  unoptimized
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border-2 border-line bg-surface-2 p-4">
              <p className="text-xs font-bold tracking-wider text-muted uppercase">Account number</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <span className="font-mono text-xl font-bold tracking-wide text-ink">{metode.nomor}</span>
                <Salin nilai={metode.nomor ?? ""} label="Account number" />
              </div>
              <p className="mt-2 text-sm text-muted">
                Account name: <span className="font-semibold text-ink">{metode.atasNama}</span>
              </p>
            </div>
          )}

          <form ref={bayar.formRef} onSubmit={bayar.onSubmit} className="mt-5 space-y-3">
            <input type="hidden" name="invoice_no" value={invoice.invoiceNo} />
            <Button type="submit" size="lg" loading={bayar.pending} className="w-full">
              I&apos;ve sent the payment
            </Button>
            <p className="text-center text-xs text-muted">
              Press this only after the transfer has gone through. We&apos;ll be notified straight away.
            </p>
          </form>
        </section>
      )}

      {sudahLapor && (
        <section className="rounded-3xl border-2 border-ink bg-surface p-5 sm:p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">
            What happens <span className="text-brand">next</span>
          </h2>
          <ol className="mt-4 space-y-4">
            {LANGKAH.map((langkah, index) => {
              const selesai = index === 0;
              return (
                <li key={langkah.judul} className="flex gap-3">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                      selesai ? "border-ok bg-ok-soft text-ok" : "border-line bg-surface-2 text-muted",
                    )}
                    aria-hidden="true"
                  >
                    {selesai ? <CheckIcon className="size-3.5" strokeWidth={3} /> : index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-ink">{langkah.judul}</span>
                    <span className="block text-sm text-muted">{langkah.detail}</span>
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
            We check payments by hand, so nothing is confirmed automatically. You&apos;ll see the order appear in your
            account as soon as it&apos;s activated.
          </p>
        </section>
      )}

      {invoice.status === "disetujui" && (
        <section className="rounded-3xl border-2 border-ok/50 bg-ok-soft p-5 sm:p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">Payment confirmed</h2>
          <p className="mt-1 text-sm text-ink">
            {invoice.orderNo ? (
              <>
                Your order <span className="font-mono font-bold">{invoice.orderNo}</span> is active. Open it from your
                account page to see the proxy list.
              </>
            ) : (
              "Your order is active. Open it from your account page."
            )}
          </p>
        </section>
      )}

      {invoice.status === "ditolak" && (
        <section className="rounded-3xl border-2 border-bad/50 bg-bad-soft p-5 sm:p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">Invoice rejected</h2>
          <p className="mt-1 text-sm text-ink">{invoice.alasanTolak ?? "Please contact us on WhatsApp."}</p>
        </section>
      )}

      {(invoice.status === "kedaluwarsa" || (invoice.status === "menunggu_bayar" && habis)) && (
        <section className="rounded-3xl border-2 border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">Invoice expired</h2>
          <p className="mt-1 text-sm text-muted">
            This invoice is past its 24-hour window, so the amount is no longer reserved. Create a new one — or message
            us on WhatsApp if you already sent the money.
          </p>
        </section>
      )}

      {menungguBayar && (
        <form ref={batal.formRef} onSubmit={batal.onSubmit} className="flex justify-center">
          <input type="hidden" name="invoice_no" value={invoice.invoiceNo} />
          <Button type="submit" variant="ghost" size="sm" loading={batal.pending}>
            Cancel this invoice
          </Button>
        </form>
      )}
    </div>
  );
}
