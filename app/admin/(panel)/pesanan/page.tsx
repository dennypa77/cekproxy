import Link from "next/link";
import { AddOrderForm } from "@/components/admin/OrderForms";
import { SearchIcon } from "@/components/icons";
import { Badge, Button, buttonClass, Card, cn, inputClass } from "@/components/ui";
import { db } from "@/lib/db";
import { daysLeft, formatDateTime, jakartaDateInput } from "@/lib/format";
import { customerPath } from "@/lib/links";
import { normalizeOrderNo } from "@/lib/order-no";
import { matchesFilter, ORDER_FILTERS, orderState, type OrderFilter } from "@/lib/order-status";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Pesanan" };

const STATE_BADGE = {
  aktif: { tone: "green", label: "Aktif" },
  akan_expired: { tone: "yellow", label: "Akan expired" },
  expired: { tone: "red", label: "Expired" },
  nonaktif: { tone: "gray", label: "Nonaktif" },
} as const;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const filter = (ORDER_FILTERS.some((f) => f.value === params.filter) ? params.filter : "semua") as OrderFilter;

  const repo = db();
  const [orders, accounts] = await Promise.all([repo.listOrders(), repo.listAccounts()]);
  const accountById = new Map(accounts.map((a) => [a.id, a]));
  const now = Date.now();

  const needle = q.toLowerCase();
  const normalizedNeedle = normalizeOrderNo(q);
  const filtered = orders.filter((order) => {
    if (!matchesFilter(order, filter, now)) return false;
    if (!needle) return true;
    const account = order.account_id ? accountById.get(order.account_id) : undefined;
    return (
      order.shopee_order_no.includes(normalizedNeedle) ||
      (order.nama_customer ?? "").toLowerCase().includes(needle) ||
      (order.catatan ?? "").toLowerCase().includes(needle) ||
      (account?.label ?? "").toLowerCase().includes(needle) ||
      (account?.email ?? "").toLowerCase().includes(needle)
    );
  });

  const availableAccounts = accounts
    .filter((a) => a.status === "available")
    .map((a) => ({ id: a.id, label: a.label, email: a.email }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">Pesanan</h1>

      <Card>
        <h2 className="mb-3 font-semibold text-ink">Tambah pesanan</h2>
        <AddOrderForm accounts={availableAccounts} defaultDate={jakartaDateInput(30)} />
      </Card>

      <Card>
        <form className="mb-4 flex flex-col gap-2 sm:flex-row" method="get">
          <input
            name="q"
            defaultValue={q}
            placeholder="Cari nomor pesanan, nama, akun, catatan…"
            className={inputClass}
          />
          <input type="hidden" name="filter" value={filter} />
          <Button type="submit" variant="secondary">
            <SearchIcon className="size-4" /> Cari
          </Button>
        </form>

        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {ORDER_FILTERS.map((option) => (
            <Link
              key={option.value}
              href={`/admin/pesanan?filter=${option.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={cn(
                "rounded-full border-2 px-3 py-1 text-sm font-bold whitespace-nowrap transition",
                filter === option.value
                  ? "border-ink bg-ink text-white"
                  : "border-ink/20 bg-white hover:border-ink",
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-lg bg-paper p-3 text-sm text-muted">Tidak ada pesanan yang cocok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted uppercase">
                <tr>
                  <th className="py-2 pr-3 font-medium">No. Pesanan</th>
                  <th className="py-2 pr-3 font-medium">Customer</th>
                  <th className="py-2 pr-3 font-medium">Akun</th>
                  <th className="py-2 pr-3 font-medium">Expired</th>
                  <th className="py-2 pr-3 font-medium">Replace</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((order) => {
                  const state = orderState(order, now);
                  const badge = STATE_BADGE[state];
                  const account = order.account_id ? accountById.get(order.account_id) : undefined;
                  return (
                    <tr key={order.id}>
                      <td className="py-2.5 pr-3 font-mono">
                        <Link href={`/admin/pesanan/${order.id}`} className="text-brand-deep hover:underline">
                          {order.shopee_order_no}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3">{order.nama_customer ?? "-"}</td>
                      <td className="py-2.5 pr-3">{account ? account.label : <span className="text-bad">Belum ditautkan</span>}</td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {formatDateTime(order.expires_at)}
                        {state !== "expired" && state !== "nonaktif" && (
                          <span className="block text-xs text-muted">{daysLeft(order.expires_at, now)} hari lagi</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        {order.replace_used} / {order.replace_quota}
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge tone={badge.tone}>{badge.label}</Badge>
                      </td>
                      <td className="py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <Link href={`/admin/pesanan/${order.id}`} className={buttonClass("secondary", "xs")}>
                            Kelola
                          </Link>
                          <a href={customerPath(order.shopee_order_no)} target="_blank" className={buttonClass("ghost", "xs")}>
                            Halaman customer ↗
                          </a>
                        </div>
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
