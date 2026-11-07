import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/components/customer/account/AccountShell";
import { ServicePill } from "@/components/Brand";
import { ServerIcon, WhatsAppIcon } from "@/components/icons";
import { Badge, buttonClass, Card } from "@/components/ui";
import { requireCustomer } from "@/lib/customer-session";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { INVOICE_AKTIF, INVOICE_BADGE } from "@/lib/invoice-status";
import { customerPath, waHelpLink } from "@/lib/links";
import type { OrderState } from "@/lib/order-status";
import { rupiah } from "@/lib/pricing";
import { listAccountOrders } from "@/lib/services/account";
import { sapuInvoiceKedaluwarsa } from "@/lib/services/invoice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Orders" };

const STATE_BADGE: Record<OrderState, { tone: "green" | "yellow" | "red" | "gray"; label: string }> = {
  aktif: { tone: "green", label: "Active" },
  akan_expired: { tone: "yellow", label: "Expiring soon" },
  expired: { tone: "red", label: "Expired" },
  nonaktif: { tone: "gray", label: "Inactive" },
};

export default async function AkunPage() {
  const customer = await requireCustomer();
  // Tidak ada cron: invoice lewat tempo disapu sambil lalu, maksimal sekali semenit.
  await sapuInvoiceKedaluwarsa();
  const [rows, invoices] = await Promise.all([
    listAccountOrders(customer.id),
    db().listInvoicesByCustomer(customer.id),
  ]);
  const invoiceAktif = invoices.filter((invoice) => INVOICE_AKTIF.includes(invoice.status));

  return (
    <AccountShell
      nama={customer.nama}
      action={
        <>
          <Link href="/account/buy" className={buttonClass("primary", "sm")}>
            + Buy a plan
          </Link>
          <Link href="/account/claim" className={buttonClass("secondary", "sm")}>
            Claim order
          </Link>
        </>
      }
    >
      {invoiceAktif.length > 0 && (
        <Card className="border-brand/50">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">
            Your <span className="text-brand">invoices</span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            Orders appear below once we&apos;ve checked the payment — usually within 2 hours.
          </p>
          <ul className="mt-4 divide-y divide-line">
            {invoiceAktif.map((invoice) => (
              <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold break-all text-ink">{invoice.invoice_no}</p>
                  <p className="mt-1 text-xs text-muted">
                    {invoice.paket_nama}
                    {invoice.jenis === "perpanjangan" && " (renewal)"} · {rupiah(invoice.total_rp)} ·{" "}
                    {formatDateTime(invoice.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={INVOICE_BADGE[invoice.status].tone}>{INVOICE_BADGE[invoice.status].label}</Badge>
                  <Link
                    href={`/account/invoice/${encodeURIComponent(invoice.invoice_no)}`}
                    className={buttonClass("secondary", "sm")}
                  >
                    Open →
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
            No <span className="text-brand">orders</span> yet
          </h2>
          <p className="mt-2 text-sm text-muted">
            Pick a plan and pay by QRIS or bank transfer — or, if you already ordered elsewhere, enter the claim code we
            gave you.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/account/buy" className={buttonClass("primary", "md")}>
              Browse plans
            </Link>
            <Link href="/account/claim" className={buttonClass("secondary", "md")}>
              Claim an order with a code
            </Link>
            <a
              href={waHelpLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("secondary", "md")}
            >
              <WhatsAppIcon className="size-4" /> Request a code from us
            </a>
          </div>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted">
            {rows.length} {rows.length === 1 ? "order" : "orders"} in this account. Click one to see its proxy list,
            bandwidth, and settings.
          </p>

          {rows.map(({ order, state, daysLeft, jenis, openable }) => {
            const badge = STATE_BADGE[state];
            return (
              <Card key={order.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-lg font-bold break-all text-ink">{order.shopee_order_no}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                      {jenis && (
                        <Badge tone="blue">
                          <ServerIcon className="size-3.5" /> {jenis}
                        </Badge>
                      )}
                      {order.nama_customer && <Badge>{order.nama_customer}</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {state === "expired" || state === "nonaktif"
                        ? `Ended ${formatDate(order.expires_at)}`
                        : `Active until ${formatDate(order.expires_at)} · ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    {openable ? (
                      <Link href={customerPath(order.shopee_order_no)} className={buttonClass("primary", "sm")}>
                        Open dashboard →
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold text-muted">This order page is now closed</span>
                    )}
                    <Link href="/account/buy#renew" className={buttonClass("secondary", "sm")}>
                      Renew
                    </Link>
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
