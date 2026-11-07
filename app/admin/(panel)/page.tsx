import Link from "next/link";
import { Badge, Card, cn } from "@/components/ui";
import { db } from "@/lib/db";
import { daysLeft, formatDate, formatDateTime } from "@/lib/format";
import { customerPath, waExpiryMessage, waTo } from "@/lib/links";
import { orderState } from "@/lib/order-status";
import { KIND_LABEL, KIND_TONE, proxyKind, type ProxyKind } from "@/lib/plan-type";
import { requireAdmin } from "@/lib/session";
import { siteUrl } from "@/lib/site";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  // Layout & page render in parallel — session check is required on every page, not just the layout.
  await requireAdmin();
  const repo = db();
  const [accounts, orders, customers, invoices] = await Promise.all([
    repo.listAccounts(),
    repo.listOrders(),
    repo.listCustomers(),
    repo.listInvoices(),
  ]);
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const now = Date.now();

  const availableAccounts = accounts.filter((a) => a.status === "available").length;
  const activeOrders = orders.filter((o) => ["aktif", "akan_expired"].includes(orderState(o, now))).length;
  const expiring = orders
    .filter((o) => orderState(o, now) === "akan_expired")
    .sort((a, b) => a.expires_at.localeCompare(b.expires_at));
  const accountLabel = new Map(accounts.map((a) => [a.id, a.label]));
  const rotatingAccounts = accounts.filter((a) => a.rotating_enabled && a.status !== "disabled").length;
  const rotatingOrders = orders.filter(
    (o) => o.order_type === "rotating" && ["aktif", "akan_expired"].includes(orderState(o, now)),
  ).length;

  // Summary of proxy types in the pool (from the stored plan info).
  const kindOrder: ProxyKind[] = ["residential", "isp", "datacenter", "mixed", "unknown"];
  const kindCounts = new Map<ProxyKind, number>();
  let totalProxies = 0;
  for (const account of accounts) {
    const kind = proxyKind(account.proxy_subtype);
    kindCounts.set(kind, (kindCounts.get(kind) ?? 0) + 1);
    if (typeof account.proxy_count === "number") totalProxies += account.proxy_count;
  }

  // Uang masuk yang belum dicek harus jadi hal pertama yang terlihat di dashboard.
  const perluVerifikasi = invoices.filter((invoice) => invoice.status === "menunggu_verifikasi").length;

  const stats = [
    { label: "Payments to check", value: perluVerifikasi, href: "/admin/invoice?filter=perlu_verifikasi" },
    { label: "Available accounts", value: availableAccounts, href: "/admin/account" },
    { label: "Active orders", value: activeOrders, href: "/admin/orders?filter=aktif" },
    { label: "Expiring in ≤3 days", value: expiring.length, href: "/admin/orders?filter=akan_expired" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight uppercase">
        <span className="text-brand">Dashboard</span>
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={cn(
              "rounded-3xl border-2 border-ink bg-surface p-5 transition-colors hover:bg-brand-softer",
              stat.value > 0 && stat.href.startsWith("/admin/invoice") && "border-warn bg-warn-soft",
            )}
          >
            <p className="text-xs font-bold tracking-wider text-muted uppercase">{stat.label}</p>
            <p className="mt-2 font-display text-5xl font-extrabold text-ink">{stat.value}</p>
          </Link>
        ))}
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-ink">Proxy types in the pool</h2>
          <p className="text-sm text-muted">
            {accounts.length} accounts · {totalProxies > 0 ? `${totalProxies} proxies` : "proxy count not checked yet"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {kindOrder.map((kind) => {
            const count = kindCounts.get(kind) ?? 0;
            if (count === 0) return null;
            return (
              <span key={kind} className="inline-flex items-center gap-2">
                <Badge tone={KIND_TONE[kind]}>
                  {KIND_LABEL[kind]}: {count} accounts
                </Badge>
              </span>
            );
          })}
        </div>
        <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
          Rotating pool: <b>{rotatingAccounts}</b> accounts marked · <b>{rotatingOrders}</b> active rotating orders ·{" "}
          <Link href="/admin/account" className="text-brand-deep hover:underline">
            manage in Account Pool
          </Link>
        </p>
        {(kindCounts.get("unknown") ?? 0) > 0 && (
          <p className="mt-3 text-sm text-muted">
            Accounts with an unknown type can be updated with the <b>Sync plan info</b> button on the Account Pool page.
          </p>
        )}
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-ink">Needs follow-up: expiring within 3 days</h2>
        <p className="mb-4 text-sm text-muted">Contact the customer via WhatsApp chat to offer a renewal.</p>
        {expiring.length === 0 ? (
          <p className="rounded-lg bg-paper p-3 text-sm text-muted">No orders are about to expire.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs text-muted uppercase">
                <tr>
                  <th className="py-2 pr-3 font-medium">Order No.</th>
                  <th className="py-2 pr-3 font-medium">Customer</th>
                  <th className="py-2 pr-3 font-medium">Account</th>
                  <th className="py-2 pr-3 font-medium">Expires</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {expiring.map((order) => (
                  <tr key={order.id}>
                    <td className="py-2 pr-3 font-mono">{order.shopee_order_no}</td>
                    <td className="py-2 pr-3">{order.nama_customer ?? "-"}</td>
                    <td className="py-2 pr-3">{order.account_id ? accountLabel.get(order.account_id) : "-"}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {formatDateTime(order.expires_at)} <Badge tone="yellow">{daysLeft(order.expires_at, now)} days</Badge>
                    </td>
                    <td className="py-2 whitespace-nowrap">
                      {(() => {
                        const wa = order.customer_id ? customerById.get(order.customer_id)?.wa_number : order.wa_number;
                        if (!wa) return null;
                        return (
                          <>
                            <a
                              href={waTo(
                                wa,
                                waExpiryMessage(
                                  order.shopee_order_no,
                                  formatDate(order.expires_at),
                                  daysLeft(order.expires_at, now),
                                  `${siteUrl()}/account`,
                                ),
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-ok hover:underline"
                            >
                              WA chat
                            </a>
                            <span className="text-line"> · </span>
                          </>
                        );
                      })()}
                      <Link href={`/admin/orders/${order.id}`} className="text-brand-deep hover:underline">
                        Details
                      </Link>
                      <span className="text-line"> · </span>
                      <a href={customerPath(order.shopee_order_no)} target="_blank" className="text-brand-deep hover:underline">
                        Customer page
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
