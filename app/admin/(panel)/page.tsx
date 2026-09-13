import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { db } from "@/lib/db";
import { daysLeft, formatDateTime } from "@/lib/format";
import { customerPath } from "@/lib/links";
import { orderState } from "@/lib/order-status";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  // Layout & page dirender paralel — cek sesi wajib di setiap page, bukan hanya layout.
  await requireAdmin();
  const repo = db();
  const [accounts, orders] = await Promise.all([repo.listAccounts(), repo.listOrders()]);
  const now = Date.now();

  const availableAccounts = accounts.filter((a) => a.status === "available").length;
  const activeOrders = orders.filter((o) => ["aktif", "akan_expired"].includes(orderState(o, now))).length;
  const expiring = orders
    .filter((o) => orderState(o, now) === "akan_expired")
    .sort((a, b) => a.expires_at.localeCompare(b.expires_at));
  const accountLabel = new Map(accounts.map((a) => [a.id, a.label]));

  const stats = [
    { label: "Akun available", value: availableAccounts, href: "/admin/akun" },
    { label: "Pesanan aktif", value: activeOrders, href: "/admin/pesanan?filter=aktif" },
    { label: "Akan expired ≤3 hari", value: expiring.length, href: "/admin/pesanan?filter=akan_expired" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight uppercase">
        <span className="text-brand">Dashboard</span>
      </h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-3xl border-2 border-ink bg-white p-5 transition-colors hover:bg-brand-softer"
          >
            <p className="text-xs font-bold tracking-wider text-muted uppercase">{stat.label}</p>
            <p className="mt-2 font-display text-5xl font-extrabold text-ink">{stat.value}</p>
          </Link>
        ))}
      </div>

      <Card>
        <h2 className="mb-1 font-semibold text-ink">Perlu follow-up: akan expired dalam 3 hari</h2>
        <p className="mb-4 text-sm text-muted">Hubungi customer di chat Shopee untuk menawarkan perpanjangan.</p>
        {expiring.length === 0 ? (
          <p className="rounded-lg bg-paper p-3 text-sm text-muted">Tidak ada pesanan yang akan expired.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs text-muted uppercase">
                <tr>
                  <th className="py-2 pr-3 font-medium">No. Pesanan</th>
                  <th className="py-2 pr-3 font-medium">Customer</th>
                  <th className="py-2 pr-3 font-medium">Akun</th>
                  <th className="py-2 pr-3 font-medium">Expired</th>
                  <th className="py-2 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {expiring.map((order) => (
                  <tr key={order.id}>
                    <td className="py-2 pr-3 font-mono">{order.shopee_order_no}</td>
                    <td className="py-2 pr-3">{order.nama_customer ?? "-"}</td>
                    <td className="py-2 pr-3">{order.account_id ? accountLabel.get(order.account_id) : "-"}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {formatDateTime(order.expires_at)} <Badge tone="yellow">{daysLeft(order.expires_at, now)} hari</Badge>
                    </td>
                    <td className="py-2 whitespace-nowrap">
                      <Link href={`/admin/pesanan/${order.id}`} className="text-brand-deep hover:underline">
                        Detail
                      </Link>
                      <span className="text-line"> · </span>
                      <a href={customerPath(order.shopee_order_no)} target="_blank" className="text-brand-deep hover:underline">
                        Halaman customer
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
