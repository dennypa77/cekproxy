import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ActionButton } from "@/components/admin/ActionButton";
import { ApproveInvoiceForm, RejectInvoiceForm } from "@/components/admin/InvoiceForms";
import { Badge, Card } from "@/components/ui";
import { expireInvoiceAction } from "@/app/admin/actions";
import { db } from "@/lib/db";
import { formatDateTime, jakartaDateInput } from "@/lib/format";
import { INVOICE_AKTIF, INVOICE_BADGE } from "@/lib/invoice-status";
import { customerPath, waTo } from "@/lib/links";
import { METODE_LABEL, type MetodeBayar } from "@/lib/payment";
import { rupiah } from "@/lib/pricing";
import { requireAdmin } from "@/lib/session";
import { formatWaNumber } from "@/lib/wa-number";

export const metadata = { title: "Invoice" };

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const repo = db();
  const invoice = await repo.getInvoice(id);
  if (!invoice) notFound();

  const [customer, accounts, extendOrder, order] = await Promise.all([
    repo.getCustomer(invoice.customer_id),
    repo.listAccounts(),
    invoice.extend_order_id ? repo.getOrder(invoice.extend_order_id) : Promise.resolve(null),
    invoice.order_id ? repo.getOrder(invoice.order_id) : Promise.resolve(null),
  ]);

  const available = accounts
    .filter((a) => a.status === "available")
    .map((a) => ({ id: a.id, label: a.label, email: a.email }));
  const badge = INVOICE_BADGE[invoice.status];
  const perpanjangan = invoice.jenis === "perpanjangan";
  // Invoice kedaluwarsa tetap bisa disetujui — kadang uangnya memang masuk.
  const bisaDiputuskan = INVOICE_AKTIF.includes(invoice.status) || invoice.status === "kedaluwarsa";

  const rows: [string, ReactNode][] = [
    ["Status", <Badge key="s" tone={badge.tone}>{badge.label}</Badge>],
    ["Type", perpanjangan ? "Renewal" : "New order"],
    ["Plan", `${invoice.paket_nama} · ${invoice.masa_aktif_hari} days`],
    ["Plan price", rupiah(invoice.harga_rp)],
    ["Unique code", `+${invoice.kode_unik}`],
    [
      "Amount to match",
      <span key="t" className="font-mono text-lg font-bold text-ink">
        {rupiah(invoice.total_rp)}
      </span>,
    ],
    ["Method", METODE_LABEL[invoice.metode as MetodeBayar] ?? invoice.metode],
    ["Created", formatDateTime(invoice.created_at)],
    ["Payment window ends", formatDateTime(invoice.expires_at)],
    ["Customer said paid", invoice.paid_claimed_at ? formatDateTime(invoice.paid_claimed_at) : "—"],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/invoice" className="text-sm font-semibold text-brand-deep hover:underline">
            ← All invoices
          </Link>
          <h1 className="font-mono text-xl font-bold text-ink">{invoice.invoice_no}</h1>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-ink">Invoice</h2>
          <dl className="divide-y divide-line text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="flex flex-wrap justify-between gap-3 py-2">
                <dt className="text-muted">{label}</dt>
                <dd className="text-right text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          {invoice.catatan_customer && (
            <p className="mt-3 rounded-lg bg-paper p-3 text-sm text-ink">
              <span className="text-xs font-bold tracking-wider text-muted uppercase">Customer note</span>
              <br />
              {invoice.catatan_customer}
            </p>
          )}
          {invoice.alasan_tolak && (
            <p className="mt-3 rounded-lg bg-bad-soft p-3 text-sm text-ink">
              <span className="text-xs font-bold tracking-wider text-muted uppercase">Rejection reason</span>
              <br />
              {invoice.alasan_tolak}
            </p>
          )}
          {invoice.catatan_admin && (
            <p className="mt-3 rounded-lg bg-paper p-3 text-sm text-ink">
              <span className="text-xs font-bold tracking-wider text-muted uppercase">Internal note</span>
              <br />
              {invoice.catatan_admin}
            </p>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-ink">Customer</h2>
          {customer ? (
            <dl className="divide-y divide-line text-sm">
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-muted">Name</dt>
                <dd className="text-ink">{customer.nama}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-muted">WhatsApp</dt>
                <dd>
                  <a
                    href={waTo(customer.wa_number, `Hi ${customer.nama}, about invoice ${invoice.invoice_no}:`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-ok hover:underline"
                  >
                    {formatWaNumber(customer.wa_number)}
                  </a>
                </dd>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-muted">Account</dt>
                <dd>
                  <Link href={`/admin/customer?q=${encodeURIComponent(customer.wa_number)}`} className="text-brand-deep hover:underline">
                    Open customer
                  </Link>
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted">Customer account no longer exists.</p>
          )}

          {extendOrder && (
            <p className="mt-3 rounded-lg bg-paper p-3 text-sm text-ink">
              Renewing <Link href={`/admin/orders/${extendOrder.id}`} className="font-mono text-brand-deep hover:underline">{extendOrder.shopee_order_no}</Link>
              , currently active until {formatDateTime(extendOrder.expires_at)}.
            </p>
          )}
          {order && (
            <p className="mt-3 rounded-lg bg-ok-soft p-3 text-sm text-ink">
              Delivered as{" "}
              <Link href={`/admin/orders/${order.id}`} className="font-mono font-bold text-brand-deep hover:underline">
                {order.shopee_order_no}
              </Link>{" "}
              ·{" "}
              <a href={customerPath(order.shopee_order_no)} target="_blank" className="text-brand-deep hover:underline">
                customer page
              </a>
            </p>
          )}
        </Card>
      </div>

      {bisaDiputuskan && (
        <>
          <Card>
            <h2 className="mb-1 font-semibold text-ink">Approve</h2>
            <p className="mb-4 text-sm text-muted">
              Check your bank statement for <b className="font-mono">{rupiah(invoice.total_rp)}</b> first. Approving
              takes the account out of the pool and hands the order to the customer in one step.
            </p>
            <ApproveInvoiceForm
              invoiceId={invoice.id}
              accounts={available}
              perpanjangan={perpanjangan}
              defaultDate={jakartaDateInput(invoice.masa_aktif_hari)}
              masaAktifHari={invoice.masa_aktif_hari}
              orderNo={extendOrder?.shopee_order_no ?? null}
            />
          </Card>

          <Card>
            <h2 className="mb-1 font-semibold text-ink">Reject or expire</h2>
            <p className="mb-4 text-sm text-muted">
              Reject if the money never arrived or the amount cannot be matched. Expiring just closes an unpaid invoice.
            </p>
            <RejectInvoiceForm invoiceId={invoice.id} />
            {invoice.status === "menunggu_bayar" && (
              <div className="mt-4 border-t border-line pt-4">
                <ActionButton
                  action={expireInvoiceAction.bind(null, invoice.id)}
                  variant="secondary"
                  size="sm"
                  confirm="Mark this invoice as expired?"
                >
                  Mark as expired
                </ActionButton>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
