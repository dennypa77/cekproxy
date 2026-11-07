import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, cn } from "@/components/ui";
import { db } from "@/lib/db";
import { checkoutEnabled } from "@/lib/env";
import { formatDateTime } from "@/lib/format";
import { cocokFilter, INVOICE_BADGE, INVOICE_FILTERS, type InvoiceFilter } from "@/lib/invoice-status";
import { waTo } from "@/lib/links";
import { METODE_LABEL, type MetodeBayar } from "@/lib/payment";
import { rupiah } from "@/lib/pricing";
import { sapuInvoiceKedaluwarsa } from "@/lib/services/invoice";
import { requireAdmin } from "@/lib/session";
import { formatWaNumber } from "@/lib/wa-number";

export const metadata = { title: "Invoices" };

export default async function InvoicePage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  await requireAdmin();
  if (!checkoutEnabled()) notFound();
  await sapuInvoiceKedaluwarsa();

  const params = await searchParams;
  const filter = (
    INVOICE_FILTERS.some((f) => f.value === params.filter) ? params.filter : "perlu_verifikasi"
  ) as InvoiceFilter;

  const repo = db();
  const [invoices, customers] = await Promise.all([repo.listInvoices(), repo.listCustomers()]);
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const filtered = invoices.filter((invoice) => cocokFilter(invoice.status, filter));
  const perluVerifikasi = invoices.filter((invoice) => invoice.status === "menunggu_verifikasi").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">Invoices</h1>
        {perluVerifikasi > 0 && (
          <Badge tone="yellow">
            {perluVerifikasi} waiting to be checked
          </Badge>
        )}
      </div>

      <Card>
        <p className="mb-4 text-sm text-muted">
          Customers pay by QRIS or bank transfer and then press <b>I&apos;ve sent the payment</b>. Match the amount in
          your bank statement — the last 3 digits are unique per invoice — then approve it here.
        </p>

        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {INVOICE_FILTERS.map((option) => (
            <Link
              key={option.value}
              href={`/admin/invoice?filter=${option.value}`}
              className={cn(
                "rounded-full border-2 px-3 py-1 text-sm font-bold whitespace-nowrap transition",
                filter === option.value ? "border-ink bg-ink text-paper" : "border-ink/20 bg-surface hover:border-ink",
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-lg bg-paper p-3 text-sm text-muted">No invoices in this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted uppercase">
                <tr>
                  <th className="py-2 pr-3 font-medium">Invoice</th>
                  <th className="py-2 pr-3 font-medium">Created</th>
                  <th className="py-2 pr-3 font-medium">Customer</th>
                  <th className="py-2 pr-3 font-medium">Plan</th>
                  <th className="py-2 pr-3 font-medium">Amount</th>
                  <th className="py-2 pr-3 font-medium">Method</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((invoice) => {
                  const customer = customerById.get(invoice.customer_id);
                  const badge = INVOICE_BADGE[invoice.status];
                  return (
                    <tr key={invoice.id}>
                      <td className="py-2.5 pr-3 font-mono">
                        <Link href={`/admin/invoice/${invoice.id}`} className="text-brand-deep hover:underline">
                          {invoice.invoice_no}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap text-muted">{formatDateTime(invoice.created_at)}</td>
                      <td className="py-2.5 pr-3">
                        {customer ? (
                          <>
                            {customer.nama}
                            <a
                              href={waTo(customer.wa_number, `Hi ${customer.nama}, about invoice ${invoice.invoice_no}:`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs font-semibold text-ok hover:underline"
                            >
                              {formatWaNumber(customer.wa_number)}
                            </a>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        {invoice.paket_nama}
                        {invoice.jenis === "perpanjangan" && (
                          <span className="ml-1.5 align-middle">
                            <Badge tone="blue">Renewal</Badge>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 font-mono font-bold whitespace-nowrap text-ink">
                        {rupiah(invoice.total_rp)}
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {METODE_LABEL[invoice.metode as MetodeBayar] ?? invoice.metode}
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge tone={badge.tone}>{badge.label}</Badge>
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <Link href={`/admin/invoice/${invoice.id}`} className="text-brand-deep hover:underline">
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
