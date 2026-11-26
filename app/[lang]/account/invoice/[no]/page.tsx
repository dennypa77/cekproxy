import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountShell } from "@/components/customer/account/AccountShell";
import { InvoicePanel } from "@/components/customer/InvoicePanel";
import { WhatsAppIcon } from "@/components/icons";
import { Badge, buttonClass } from "@/components/ui";
import { requireCustomer } from "@/lib/customer-session";
import { db } from "@/lib/db";
import { checkoutEnabled } from "@/lib/env";
import { formatDateTime } from "@/lib/format";
import { INVOICE_BADGE } from "@/lib/invoice-status";
import { waHelpLink } from "@/lib/links";
import { findMetode } from "@/lib/payment";
import { rupiah, usd } from "@/lib/pricing";
import { sapuInvoiceKedaluwarsa } from "@/lib/services/invoice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: { params: Promise<{ no: string }> }) {
  if (!checkoutEnabled()) notFound();
  const [{ no }, customer] = await Promise.all([params, requireCustomer()]);
  await sapuInvoiceKedaluwarsa();

  // Query sudah memfilter customer_id di SQL: invoice orang lain = 404,
  // jadi keberadaan nomornya pun tidak bocor.
  const invoice = await db().getInvoiceByNoForCustomer(decodeURIComponent(no), customer.id);
  if (!invoice) notFound();

  const metode = findMetode(invoice.metode);
  const badge = INVOICE_BADGE[invoice.status];
  const order = invoice.order_id ? await db().getOrder(invoice.order_id) : null;

  return (
    <AccountShell
      nama={customer.nama}
      eyebrow="Checkout"
      judul="Your"
      aksen="invoice"
      action={
        <Link href="/account" className={buttonClass("secondary", "sm")}>
          ← My orders
        </Link>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-lg font-bold break-all text-ink">{invoice.invoice_no}</p>
          <p className="text-xs text-muted">Created {formatDateTime(invoice.created_at)}</p>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      <InvoicePanel
        invoice={{
          invoiceNo: invoice.invoice_no,
          status: invoice.status,
          paketNama: invoice.paket_nama,
          jenisPerpanjangan: invoice.jenis === "perpanjangan",
          masaAktifHari: invoice.masa_aktif_hari,
          totalRp: invoice.total_rp,
          totalLabel: rupiah(invoice.total_rp),
          usdLabel: usd(invoice.total_rp),
          hargaLabel: rupiah(invoice.harga_rp),
          kodeUnik: invoice.kode_unik,
          expiresAt: invoice.expires_at,
          alasanTolak: invoice.alasan_tolak,
          orderNo: order?.shopee_order_no ?? null,
        }}
        metode={
          metode && {
            kode: metode.kode,
            nama: metode.nama,
            nomor: metode.nomor,
            atasNama: metode.atasNama,
            gambar: metode.gambar,
            petunjuk: metode.petunjuk,
          }
        }
      />

      <div className="flex justify-center pt-2">
        <a
          href={waHelpLink(invoice.invoice_no)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("secondary", "sm")}
        >
          <WhatsAppIcon className="size-4" /> Question about this invoice?
        </a>
      </div>
    </AccountShell>
  );
}
