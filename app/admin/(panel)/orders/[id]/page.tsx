import Link from "next/link";
import { notFound } from "next/navigation";
import {
  detachOrderCustomerAction,
  extendOrderAction,
  generateClaimCodeAction,
  linkOrderAccountAction,
  regenerateRotatingKeyAction,
  releaseOrderAccountAction,
  revokeClaimCodeAction,
  resetReplaceUsedAction,
  toggleOrderActiveAction,
  updateOrderAction,
  updateOrderCredentialsAction,
  updateRotatingLimitAction,
} from "@/app/admin/actions";
import { AccountBandwidth } from "@/components/admin/AccountBandwidth";
import { ActionButton } from "@/components/admin/ActionButton";
import { ClaimCodeCard } from "@/components/admin/ClaimCodeCard";
import { CredentialsForm, EditOrderForm, ExtendOrderForm, LinkAccountForm } from "@/components/admin/OrderForms";
import { RotatingOrderCard } from "@/components/admin/RotatingOrderCard";
import { ChevronLeftIcon } from "@/components/icons";
import { Badge, buttonClass, Card } from "@/components/ui";
import { db } from "@/lib/db";
import { countryFlag, daysLeft, formatDateTime, jakartaDateInput } from "@/lib/format";
import { customerPath } from "@/lib/links";
import { orderState } from "@/lib/order-status";
import { KIND_TONE, planLabel, proxyKind } from "@/lib/plan-type";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Manage Order" };

const LOG_BADGE = {
  success: { tone: "green", label: "success" },
  failed: { tone: "red", label: "failed" },
  pending: { tone: "yellow", label: "pending" },
} as const;

const STATE_LABEL = {
  aktif: "active",
  akan_expired: "expiring soon",
  expired: "expired",
  nonaktif: "inactive",
} as const;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const repo = db();
  const order = await repo.getOrder(id);
  if (!order) notFound();

  const [account, accounts, logs, pemilik] = await Promise.all([
    order.account_id ? repo.getAccount(order.account_id) : Promise.resolve(null),
    repo.listAccounts(),
    repo.listReplaceLogs(order.id, 100),
    order.customer_id ? repo.getCustomer(order.customer_id) : Promise.resolve(null),
  ]);
  const available = accounts
    .filter((a) => a.status === "available")
    .map((a) => ({ id: a.id, label: a.label, email: a.email }));
  const now = Date.now();
  const state = orderState(order, now);
  const expiresDate = jakartaDateInput(0, new Date(order.expires_at).getTime());
  const rotating = order.order_type === "rotating";

  return (
    <div className="space-y-4">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeftIcon className="size-4" /> Back to order list
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted uppercase">Order number</p>
            <h1 className="font-mono text-xl font-bold break-all text-ink">{order.shopee_order_no}</h1>
            <p className="text-sm text-muted">{order.nama_customer ?? "No name"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Badge
                tone={state === "aktif" ? "green" : state === "akan_expired" ? "yellow" : state === "expired" ? "red" : "gray"}
              >
                {STATE_LABEL[state]}
              </Badge>
              <Badge tone={rotating ? "blue" : "gray"}>{rotating ? "Rotating" : "Static"}</Badge>
              <span>
                Expires {formatDateTime(order.expires_at)}
                {state === "aktif" || state === "akan_expired" ? ` (${daysLeft(order.expires_at, now)} days left)` : ""}
              </span>
            </div>
            <p className="mt-1 text-sm">
              {rotating
                ? `Request limit: ${order.rate_per_minute}/min`
                : `Replace: ${order.replace_used} / ${order.replace_quota}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={customerPath(order.shopee_order_no)} target="_blank" className={buttonClass("primary", "sm")}>
              Open customer page ↗
            </a>
            <ActionButton
              action={toggleOrderActiveAction.bind(null, order.id)}
              size="sm"
              variant={order.is_active ? "dangerSoft" : "secondary"}
              confirm={order.is_active ? "Deactivate this order? The customer won't be able to open the order page." : undefined}
            >
              {order.is_active ? "Deactivate" : "Activate"}
            </ActionButton>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-ink">Edit order</h2>
          <EditOrderForm
            action={updateOrderAction.bind(null, order.id)}
            order={{
              shopee_order_no: order.shopee_order_no,
              nama_customer: order.nama_customer,
              expiresDate,
              replace_quota: order.replace_quota,
              replace_used: order.replace_used,
              catatan: order.catatan,
              wa_number: order.wa_number,
            }}
            hideReplace={rotating}
          />
          {!rotating && (
          <div className="mt-3 border-t border-line pt-3">
            <ActionButton
              action={resetReplaceUsedAction.bind(null, order.id)}
              size="sm"
              confirm="Reset replace usage to 0?"
              disabled={order.replace_used === 0}
            >
              Reset replace used to 0
            </ActionButton>
          </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-1 font-semibold text-ink">Customer account &amp; claim code</h2>
            <p className="mb-3 text-sm text-muted">
              The customer uses this code to link the order to their account.
            </p>
            <ClaimCodeCard
              orderNo={order.shopee_order_no}
              claimCode={order.claim_code}
              claimExpiresLabel={order.claim_code_expires_at ? formatDateTime(order.claim_code_expires_at) : null}
              customer={
                pemilik
                  ? {
                      nama: pemilik.nama,
                      waNumber: pemilik.wa_number,
                      claimedLabel: order.claimed_at ? formatDateTime(order.claimed_at) : "-",
                    }
                  : null
              }
              orderWaNumber={order.wa_number}
              generateAction={generateClaimCodeAction.bind(null, order.id)}
              revokeAction={revokeClaimCodeAction.bind(null, order.id)}
              detachAction={detachOrderCustomerAction.bind(null, order.id)}
            />
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-ink">Extend</h2>
            <ExtendOrderForm action={extendOrderAction.bind(null, order.id)} />
          </Card>

          {rotating ? (
            <Card>
              <h2 className="mb-1 font-semibold text-ink">Rotating access</h2>
              <p className="mb-3 text-sm text-muted">
                Proxies are drawn at random from all accounts marked to join the rotating pool on the Account Pool page.
              </p>
              {order.api_key ? (
                <RotatingOrderCard
                  apiKey={order.api_key}
                  ratePerMinute={order.rate_per_minute}
                  regenerateAction={regenerateRotatingKeyAction.bind(null, order.id)}
                  limitAction={updateRotatingLimitAction.bind(null, order.id)}
                />
              ) : (
                <p className="text-sm text-bad">This rotating order has no API key yet.</p>
              )}
            </Card>
          ) : (
          <Card>
            <h2 className="mb-3 font-semibold text-ink">Linked account</h2>
            {account ? (
              <div className="space-y-3">
                <div className="text-sm">
                  <Link href={`/admin/account/${account.id}`} className="font-medium text-brand-deep hover:underline">
                    {account.label}
                  </Link>
                  <p className="text-muted">{account.email ?? "-"}</p>
                  <p className="mt-2">
                    <Badge tone={KIND_TONE[proxyKind(account.proxy_subtype)]}>{planLabel(account)}</Badge>
                  </p>
                  <p className="mt-1">
                    Bandwidth: <AccountBandwidth accountId={account.id} />
                  </p>
                </div>
                <ActionButton
                  action={releaseOrderAccountAction.bind(null, order.id)}
                  variant="dangerSoft"
                  size="sm"
                  confirm={
                    "Release the account from this order? The account goes back to available.\n\nBefore it is used by another customer, we recommend clearing the IP whitelist and changing the proxy password in the provider dashboard."
                  }
                >
                  Release account
                </ActionButton>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-bad">This order has no account yet. The customer sees a &quot;being prepared&quot; message.</p>
                <LinkAccountForm action={linkOrderAccountAction.bind(null, order.id)} accounts={available} />
              </div>
            )}
          </Card>
          )}
        </div>
      </div>

      {account && (
        <Card>
          <h2 className="mb-3 font-semibold text-ink">Proxy username &amp; password</h2>
          <CredentialsForm action={updateOrderCredentialsAction.bind(null, order.id)} />
        </Card>
      )}

      {!rotating && (
      <Card>
        <h2 className="mb-3 font-semibold text-ink">
          Replace log <span className="font-normal text-muted">(last {logs.length})</span>
        </h2>
        {logs.length === 0 ? (
          <p className="rounded-lg bg-paper p-3 text-sm text-muted">No replace attempts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted uppercase">
                <tr>
                  <th className="py-2 pr-3 font-medium">Time</th>
                  <th className="py-2 pr-3 font-medium">Old IP</th>
                  <th className="py-2 pr-3 font-medium">Country</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {logs.map((log) => (
                  <tr key={log.id} className="align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                    <td className="py-2 pr-3 font-mono">{log.old_ip}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {log.new_country === "ANY" ? "🎲 Random" : `${countryFlag(log.new_country)} ${log.new_country}`}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge tone={LOG_BADGE[log.status].tone}>{LOG_BADGE[log.status].label}</Badge>
                    </td>
                    <td className="py-2 font-mono text-xs break-all text-muted">
                      {log.error ?? "-"}
                      {log.replacement_id ? <span className="block text-muted">id: {log.replacement_id}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      )}
    </div>
  );
}
