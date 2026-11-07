import Link from "next/link";
import {
  deleteAccountAction,
  syncPlansAction,
  toggleAccountDisabledAction,
  toggleAccountRotatingAction,
} from "@/app/admin/actions";
import { AccountBandwidth } from "@/components/admin/AccountBandwidth";
import { AddAccountForm, BulkImportForm } from "@/components/admin/AccountForms";
import { ActionButton } from "@/components/admin/ActionButton";
import { Badge, buttonClass, Card } from "@/components/ui";
import { db, type AccountStatus } from "@/lib/db";
import { maskSecret } from "@/lib/format";
import { KIND_SHORT, KIND_TONE, planDetail, planLabel, proxyKind } from "@/lib/plan-type";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Account Pool" };
// Validation / bulk import calls the API for every key.
export const maxDuration = 60;

const STATUS_BADGE: Record<AccountStatus, { tone: "green" | "blue" | "gray"; label: string }> = {
  available: { tone: "green", label: "available" },
  assigned: { tone: "blue", label: "assigned" },
  disabled: { tone: "gray", label: "disabled" },
};

export default async function AccountsPage() {
  await requireAdmin();
  const repo = db();
  const [accounts, orders] = await Promise.all([repo.listAccounts(), repo.listOrders()]);
  const orderByAccount = new Map(orders.filter((o) => o.account_id).map((o) => [o.account_id as string, o]));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">Account Pool</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-ink">Add account</h2>
          <AddAccountForm />
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold text-ink">Bulk import</h2>
          <BulkImportForm />
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-ink">
            Account list <span className="font-normal text-muted">({accounts.length})</span>
          </h2>
          <ActionButton action={syncPlansAction} size="sm">
            Sync plan info
          </ActionButton>
        </div>
        {accounts.length === 0 ? (
          <p className="rounded-lg bg-paper p-3 text-sm text-muted">No accounts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1020px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted uppercase">
                <tr>
                  <th className="py-2 pr-3 font-medium">Label</th>
                  <th className="py-2 pr-3 font-medium">API key</th>
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Rotating pool</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Order</th>
                  <th className="py-2 pr-3 font-medium">Bandwidth</th>
                  <th className="py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {accounts.map((account) => {
                  const order = orderByAccount.get(account.id);
                  const badge = STATUS_BADGE[account.status];
                  return (
                    <tr key={account.id} className="align-top">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-ink">{account.label}</p>
                        <p className="text-xs text-muted">{account.email ?? "-"}</p>
                        {account.catatan && <p className="mt-0.5 max-w-xs text-xs text-muted">{account.catatan}</p>}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs">{maskSecret(account.api_key)}</td>
                      <td className="py-2.5 pr-3">
                        <Badge tone={KIND_TONE[proxyKind(account.proxy_subtype)]}>
                          {KIND_SHORT[proxyKind(account.proxy_subtype)]}
                        </Badge>
                        <p className="mt-0.5 text-xs text-muted">{planDetail(account) ?? "not checked"}</p>
                      </td>
                      <td className="py-2.5 pr-3">
                        {account.rotating_enabled ? (
                          <>
                            <Badge tone="blue">in pool</Badge>
                            <p className="mt-0.5 text-xs whitespace-nowrap text-muted">
                              {account.rotating_reserve_gb === null
                                ? "no reserve"
                                : `${account.rotating_reserve_gb} GB reserve`}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-muted">not in pool</span>
                        )}
                        <div className="mt-1">
                          <ActionButton
                            action={toggleAccountRotatingAction.bind(null, account.id)}
                            disabled={account.status === "disabled"}
                            title={account.status === "disabled" ? "A disabled account cannot join the pool" : undefined}
                          >
                            {account.rotating_enabled ? "Remove" : "Add"}
                          </ActionButton>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge tone={badge.tone}>{badge.label}</Badge>
                      </td>
                      <td className="py-2.5 pr-3">
                        {order ? (
                          <Link href={`/admin/orders/${order.id}`} className="font-mono text-brand-deep hover:underline">
                            {order.shopee_order_no}
                          </Link>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        {account.status === "disabled" ? <span className="text-xs text-muted">-</span> : <AccountBandwidth accountId={account.id} />}
                      </td>
                      <td className="py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <Link href={`/admin/account/${account.id}`} className={buttonClass("secondary", "xs")}>
                            Edit
                          </Link>
                          <ActionButton
                            action={toggleAccountDisabledAction.bind(null, account.id)}
                            disabled={account.status === "assigned"}
                            title={account.status === "assigned" ? "Release the account from its order first" : undefined}
                          >
                            {account.status === "disabled" ? "Enable" : "Disable"}
                          </ActionButton>
                          <ActionButton
                            action={deleteAccountAction.bind(null, account.id)}
                            variant="dangerSoft"
                            disabled={Boolean(order) || account.status === "assigned"}
                            title={order ? "Account is still linked to an order" : undefined}
                            confirm={`Delete account "${account.label}"? This action cannot be undone.`}
                          >
                            Delete
                          </ActionButton>
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
