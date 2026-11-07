import { AllProxies, type ProxyAccountInfo } from "@/components/admin/AllProxies";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "All Proxies" };
export const dynamic = "force-dynamic";
// Each account's proxy list is fetched via the API (loaded incrementally from the browser).
export const maxDuration = 60;

export default async function AllProxiesPage() {
  await requireAdmin();

  const repo = db();
  const [accounts, orders] = await Promise.all([repo.listAccounts(), repo.listOrders()]);
  const orderByAccount = new Map(orders.filter((o) => o.account_id).map((o) => [o.account_id as string, o]));

  // Disabled accounts are skipped: their API key is usually no longer valid.
  const usable: ProxyAccountInfo[] = accounts
    .filter((account) => account.status !== "disabled")
    .map((account) => {
      const order = orderByAccount.get(account.id);
      return {
        id: account.id,
        label: account.label,
        email: account.email,
        orderId: order?.id ?? null,
        orderNo: order?.shopee_order_no ?? null,
        proxySubtype: account.proxy_subtype,
      };
    });

  const disabledCount = accounts.length - usable.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight uppercase">
          All <span className="text-brand">Proxies</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          Every proxy from all accounts in the pool, with username, password, country, and the order using it.
          {disabledCount > 0 && ` ${disabledCount} disabled accounts are hidden.`}
        </p>
      </div>

      {usable.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-ink/40 bg-paper p-6 text-center text-sm text-muted">
          No active accounts in the pool yet.
        </p>
      ) : (
        <AllProxies accounts={usable} />
      )}
    </div>
  );
}
