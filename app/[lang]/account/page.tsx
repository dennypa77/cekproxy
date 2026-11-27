import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/components/customer/account/AccountShell";
import { ServicePill } from "@/components/Brand";
import { ServerIcon, WhatsAppIcon } from "@/components/icons";
import { Badge, buttonClass, Card } from "@/components/ui";
import { requireCustomer } from "@/lib/customer-session";
import { db } from "@/lib/db";
import { checkoutEnabled } from "@/lib/env";
import { formatDate, formatDateTime } from "@/lib/format";
import { isiVar, jalur } from "@/lib/i18n";
import { bahasaSekarang, kamus } from "@/lib/kamus";
import { INVOICE_AKTIF, INVOICE_BADGE, labelInvoice } from "@/lib/invoice-status";
import { customerPath, waExtendLink, waHelpLink, waOrderGeneralLink } from "@/lib/links";
import type { OrderState } from "@/lib/order-status";
import { rupiah } from "@/lib/pricing";
import { listAccountOrders } from "@/lib/services/account";
import { sapuInvoiceKedaluwarsa } from "@/lib/services/invoice";

export const dynamic = "force-dynamic";


const STATE_TONE: Record<OrderState, "green" | "yellow" | "red" | "gray"> = {
  aktif: "green",
  akan_expired: "yellow",
  expired: "red",
  nonaktif: "gray",
};

export default async function AkunPage() {
  const k = await kamus();
  const bahasa = await bahasaSekarang();
  const STATE_LABEL: Record<OrderState, string> = {
    aktif: k.pesanan.status.aktif,
    akan_expired: k.pesanan.status.akanExpired,
    expired: k.pesanan.status.expired,
    nonaktif: k.pesanan.status.nonaktif,
  };
  const customer = await requireCustomer();
  const checkout = checkoutEnabled();
  // Selama checkout mati, tabel invoices tidak disentuh sama sekali.
  if (checkout) {
    // Tidak ada cron: invoice lewat tempo disapu sambil lalu, maksimal sekali semenit.
    await sapuInvoiceKedaluwarsa();
  }
  const [rows, invoices] = await Promise.all([
    listAccountOrders(customer.id),
    checkout ? db().listInvoicesByCustomer(customer.id) : Promise.resolve([]),
  ]);
  const invoiceAktif = invoices.filter((invoice) => INVOICE_AKTIF.includes(invoice.status));

  return (
    <AccountShell
      nama={customer.nama}
      action={
        <>
          {checkout ? (
            <Link href={jalur(bahasa, "/account/buy")} className={buttonClass("primary", "sm")}>
              {k.pesanan.beliPaket}
            </Link>
          ) : (
            <a
              href={waOrderGeneralLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("primary", "sm")}
            >
              <WhatsAppIcon className="size-4" /> {k.pesanan.pesanPaket}
            </a>
          )}
          <Link href={jalur(bahasa, "/account/claim")} className={buttonClass("secondary", "sm")}>
            {k.pesanan.klaimPesanan}
          </Link>
        </>
      }
    >
      {invoiceAktif.length > 0 && (
        <Card className="border-brand/50">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">
            {k.pesanan.invoiceJudul} <span className="text-brand">{k.pesanan.invoiceAksen}</span>
          </h2>
          <p className="mt-1 text-sm text-muted">{k.pesanan.invoiceRingkas}</p>
          <ul className="mt-4 divide-y divide-line">
            {invoiceAktif.map((invoice) => (
              <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold break-all text-ink">{invoice.invoice_no}</p>
                  <p className="mt-1 text-xs text-muted">
                    {invoice.paket_nama}
                    {invoice.jenis === "perpanjangan" && k.pesanan.renewalSuffix} · {rupiah(invoice.total_rp)} ·{" "}
                    {formatDateTime(invoice.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={INVOICE_BADGE[invoice.status].tone}>{labelInvoice(k, invoice.status)}</Badge>
                  <Link
                    href={jalur(bahasa, `/account/invoice/${encodeURIComponent(invoice.invoice_no)}`)}
                    className={buttonClass("secondary", "sm")}
                  >
                    {k.pesanan.buka}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {rows.length === 0 ? (
        <Card>
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">
            {k.pesanan.belumAdaJudul} <span className="text-brand">{k.pesanan.belumAdaAksen}</span>
          </h2>
          <p className="mt-2 text-sm text-muted">
            {checkout
              ? k.pesanan.belumAdaCheckout
              : k.pesanan.belumAdaWa}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {checkout ? (
              <Link href={jalur(bahasa, "/account/buy")} className={buttonClass("primary", "md")}>
                {k.pesanan.lihatPaket}
              </Link>
            ) : (
              <a
                href={waOrderGeneralLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("primary", "md")}
              >
                <WhatsAppIcon className="size-4" /> {k.pesanan.pesanLewatWa}
              </a>
            )}
            <Link href={jalur(bahasa, "/account/claim")} className={buttonClass("secondary", "md")}>
              {k.pesanan.klaimDenganKode}
            </Link>
            <a
              href={waHelpLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("secondary", "md")}
            >
              <WhatsAppIcon className="size-4" /> {k.pesanan.mintaKode}
            </a>
          </div>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted">
            {isiVar(k.pesanan.jumlahSatu, { n: rows.length })}
          </p>

          {rows.map(({ order, state, daysLeft, jenis, openable }) => {
            const tone = STATE_TONE[state];
            return (
              <Card key={order.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-lg font-bold break-all text-ink">{order.shopee_order_no}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone={tone}>{STATE_LABEL[state]}</Badge>
                      {jenis && (
                        <Badge tone="blue">
                          <ServerIcon className="size-3.5" /> {jenis}
                        </Badge>
                      )}
                      {order.nama_customer && <Badge>{order.nama_customer}</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {state === "expired" || state === "nonaktif"
                        ? isiVar(k.pesanan.berakhir, { tanggal: formatDate(order.expires_at) })
                        : isiVar(k.pesanan.aktifSampai, {
                            tanggal: formatDate(order.expires_at),
                            hari: daysLeft,
                          })}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    {openable ? (
                      <Link
                        href={jalur(bahasa, customerPath(order.shopee_order_no))}
                        className={buttonClass("primary", "sm")}
                      >
                        {k.pesanan.bukaDashboard}
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold text-muted">{k.pesanan.halamanDitutup}</span>
                    )}
                    {checkout ? (
                      <Link href={jalur(bahasa, "/account/buy#renew")} className={buttonClass("secondary", "sm")}>
                        {k.pesanan.perpanjang}
                      </Link>
                    ) : (
                      <a
                        href={waExtendLink(order.shopee_order_no, formatDate(order.expires_at))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClass("secondary", "sm")}
                      >
                        <WhatsAppIcon className="size-4" /> {k.pesanan.perpanjang}
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </>
      )}

      <div className="flex flex-col items-center gap-3 pt-4">
        <a href={waHelpLink()} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
          <WhatsAppIcon className="size-4" /> Need help? Chat with us
        </a>
        <ServicePill />
      </div>
    </AccountShell>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const k = await kamus();
  return { title: k.pesanan.meta };
}
