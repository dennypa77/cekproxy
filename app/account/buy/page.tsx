import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AccountShell } from "@/components/customer/account/AccountShell";
import { BuyCatalog, type PaketRow } from "@/components/customer/BuyCatalog";
import { Badge, buttonClass } from "@/components/ui";
import { getCustomer } from "@/lib/customer-session";
import { checkoutEnabled } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { INVOICE_AKTIF, INVOICE_BADGE } from "@/lib/invoice-status";
import { db } from "@/lib/db";
import { metodeBayar } from "@/lib/payment";
import {
  labelBandwidth,
  labelDurasi,
  MASA_AKTIF_HARI,
  PAKET_ROTATING,
  rupiah,
  SEMUA_PAKET,
  usd,
  usdPerHari,
  usdPerIp,
} from "@/lib/pricing";
import { listPerpanjang, sapuInvoiceKedaluwarsa } from "@/lib/services/invoice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Buy a plan" };

const ROWS: PaketRow[] = [
  ...SEMUA_PAKET.map((paket) => ({
    sku: paket.sku,
    kategoriId: paket.kategoriId,
    kategoriNama: paket.kategoriNama,
    grupLabel: paket.grupLabel,
    rotating: false,
    ip: paket.ip,
    bandwidthLabel: labelBandwidth(paket.bandwidthGb),
    hargaLabel: rupiah(paket.hargaRp),
    usdLabel: usd(paket.hargaRp),
    perIpLabel: `${usdPerIp(paket)} / IP`,
    durasiLabel: labelDurasi(MASA_AKTIF_HARI),
    populer: Boolean(paket.populer),
  })),
  ...PAKET_ROTATING.map((paket) => ({
    sku: paket.sku,
    kategoriId: paket.kategoriId,
    kategoriNama: paket.kategoriNama,
    grupLabel: "Rotating",
    rotating: true,
    // Pool gabungan: tidak ada jumlah IP maupun kuota GB untuk ditampilkan.
    ip: 0,
    bandwidthLabel: "Shared pool",
    hargaLabel: rupiah(paket.hargaRp),
    usdLabel: usd(paket.hargaRp),
    perIpLabel: `${usdPerHari(paket)} / day`,
    durasiLabel: labelDurasi(paket.hari),
    populer: Boolean(paket.populer),
  })),
];

export default async function BeliPage({ searchParams }: { searchParams: Promise<{ sku?: string }> }) {
  // Checkout masih dimatikan → halaman ini memang tidak ada.
  if (!checkoutEnabled()) notFound();

  // sku dibaca lebih dulu supaya ikut terbawa kalau pengunjung belum punya akun.
  const { sku } = await searchParams;
  const customer = await getCustomer();
  if (!customer) {
    // Pembeli yang menekan "Buy" dari daftar harga hampir selalu orang baru,
    // jadi diarahkan ke pendaftaran — halaman itu sendiri menyediakan tautan
    // "Log in here" bagi yang ternyata sudah punya akun.
    const tujuan = sku ? `/account/buy?sku=${encodeURIComponent(sku)}` : "/account/buy";
    redirect(`/account/register?next=${encodeURIComponent(tujuan)}`);
  }

  // Tidak ada cron: invoice lewat tempo disapu sambil lalu, maksimal sekali semenit.
  await sapuInvoiceKedaluwarsa();

  const [perpanjang, invoices] = await Promise.all([
    listPerpanjang(customer.id),
    db().listInvoicesByCustomer(customer.id),
  ]);

  const aktif = invoices.filter((invoice) => INVOICE_AKTIF.includes(invoice.status));

  return (
    <AccountShell
      nama={customer.nama}
      eyebrow="Checkout"
      judul="Pick a"
      aksen="plan"
      action={
        <Link href="/account" className={buttonClass("secondary", "sm")}>
          ← My orders
        </Link>
      }
    >
      <p className="text-sm text-muted">
        Pay by QRIS or bank transfer. We check every payment by hand, so your proxies are usually ready within 2 hours
        — often much sooner. Prices are charged in Indonesian rupiah.
      </p>

      {aktif.length > 0 && (
        <div className="rounded-3xl border-2 border-brand/50 bg-surface-2 p-5">
          <p className="text-xs font-bold tracking-wider text-muted uppercase">Open invoices</p>
          <ul className="mt-3 divide-y divide-line">
            {aktif.map((invoice) => (
              <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="font-mono text-sm font-bold text-ink">{invoice.invoice_no}</span>
                  <span className="ml-2 align-middle">
                    <Badge tone={INVOICE_BADGE[invoice.status].tone}>{INVOICE_BADGE[invoice.status].label}</Badge>
                  </span>
                  <span className="block text-xs text-muted">
                    {invoice.paket_nama} · {rupiah(invoice.total_rp)} · created {formatDate(invoice.created_at)}
                  </span>
                </span>
                <Link
                  href={`/account/invoice/${encodeURIComponent(invoice.invoice_no)}`}
                  className={buttonClass("secondary", "sm")}
                >
                  Open →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <BuyCatalog
        paket={ROWS}
        metode={metodeBayar().map((m) => ({ kode: m.kode, nama: m.nama }))}
        perpanjang={perpanjang.map((item) => ({
          orderId: item.orderId,
          orderNo: item.orderNo,
          expiresLabel: formatDate(item.expiresAt),
          rotating: item.rotating,
          skuTebakan: item.skuTebakan,
          invoiceBerjalan: item.invoiceBerjalan,
        }))}
        masaAktifHari={MASA_AKTIF_HARI}
        skuAwal={sku ?? null}
      />
    </AccountShell>
  );
}
