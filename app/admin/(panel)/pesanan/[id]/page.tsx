import Link from "next/link";
import { notFound } from "next/navigation";
import {
  extendOrderAction,
  linkOrderAccountAction,
  releaseOrderAccountAction,
  resetReplaceUsedAction,
  toggleOrderActiveAction,
  updateOrderAction,
} from "@/app/admin/actions";
import { AccountBandwidth } from "@/components/admin/AccountBandwidth";
import { ActionButton } from "@/components/admin/ActionButton";
import { EditOrderForm, ExtendOrderForm, LinkAccountForm } from "@/components/admin/OrderForms";
import { ChevronLeftIcon } from "@/components/icons";
import { Badge, buttonClass, Card } from "@/components/ui";
import { db } from "@/lib/db";
import { countryFlag, daysLeft, formatDateTime, jakartaDateInput } from "@/lib/format";
import { customerPath } from "@/lib/links";
import { orderState } from "@/lib/order-status";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Kelola Pesanan" };

const LOG_BADGE = {
  success: { tone: "green", label: "success" },
  failed: { tone: "red", label: "failed" },
  pending: { tone: "yellow", label: "pending" },
} as const;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const repo = db();
  const order = await repo.getOrder(id);
  if (!order) notFound();

  const [account, accounts, logs] = await Promise.all([
    order.account_id ? repo.getAccount(order.account_id) : Promise.resolve(null),
    repo.listAccounts(),
    repo.listReplaceLogs(order.id, 100),
  ]);
  const available = accounts
    .filter((a) => a.status === "available")
    .map((a) => ({ id: a.id, label: a.label, email: a.email }));
  const now = Date.now();
  const state = orderState(order, now);
  const expiresDate = jakartaDateInput(0, new Date(order.expires_at).getTime());

  return (
    <div className="space-y-4">
      <Link href="/admin/pesanan" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeftIcon className="size-4" /> Kembali ke daftar pesanan
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted uppercase">Nomor pesanan</p>
            <h1 className="font-mono text-xl font-bold break-all text-ink">{order.shopee_order_no}</h1>
            <p className="text-sm text-muted">{order.nama_customer ?? "Tanpa nama"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Badge
                tone={state === "aktif" ? "green" : state === "akan_expired" ? "yellow" : state === "expired" ? "red" : "gray"}
              >
                {state.replace("_", " ")}
              </Badge>
              <span>
                Expired {formatDateTime(order.expires_at)}
                {state === "aktif" || state === "akan_expired" ? ` (${daysLeft(order.expires_at, now)} hari lagi)` : ""}
              </span>
            </div>
            <p className="mt-1 text-sm">
              Replace: {order.replace_used} / {order.replace_quota}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={customerPath(order.shopee_order_no)} target="_blank" className={buttonClass("primary", "sm")}>
              Buka halaman customer ↗
            </a>
            <ActionButton
              action={toggleOrderActiveAction.bind(null, order.id)}
              size="sm"
              variant={order.is_active ? "dangerSoft" : "secondary"}
              confirm={order.is_active ? "Nonaktifkan pesanan ini? Customer tidak bisa membuka halaman pesanan." : undefined}
            >
              {order.is_active ? "Nonaktifkan" : "Aktifkan"}
            </ActionButton>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-ink">Edit pesanan</h2>
          <EditOrderForm
            action={updateOrderAction.bind(null, order.id)}
            order={{
              shopee_order_no: order.shopee_order_no,
              nama_customer: order.nama_customer,
              expiresDate,
              replace_quota: order.replace_quota,
              replace_used: order.replace_used,
              catatan: order.catatan,
            }}
          />
          <div className="mt-3 border-t border-line pt-3">
            <ActionButton
              action={resetReplaceUsedAction.bind(null, order.id)}
              size="sm"
              confirm="Reset pemakaian replace menjadi 0?"
              disabled={order.replace_used === 0}
            >
              Reset replace terpakai ke 0
            </ActionButton>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 font-semibold text-ink">Perpanjang</h2>
            <ExtendOrderForm action={extendOrderAction.bind(null, order.id)} />
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-ink">Akun tertaut</h2>
            {account ? (
              <div className="space-y-3">
                <div className="text-sm">
                  <Link href={`/admin/akun/${account.id}`} className="font-medium text-brand-deep hover:underline">
                    {account.label}
                  </Link>
                  <p className="text-muted">{account.email ?? "-"}</p>
                  <p className="mt-1">
                    Bandwidth: <AccountBandwidth accountId={account.id} />
                  </p>
                </div>
                <ActionButton
                  action={releaseOrderAccountAction.bind(null, order.id)}
                  variant="dangerSoft"
                  size="sm"
                  confirm={
                    "Lepas akun dari pesanan ini? Akun kembali berstatus available.\n\nSebelum dipakai customer lain, disarankan membersihkan IP whitelist dan mengganti password proxy di dashboard penyedia."
                  }
                >
                  Lepas akun
                </ActionButton>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-bad">Pesanan belum memiliki akun. Customer melihat pesan &quot;sedang disiapkan&quot;.</p>
                <LinkAccountForm action={linkOrderAccountAction.bind(null, order.id)} accounts={available} />
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold text-ink">
          Log replace <span className="font-normal text-muted">({logs.length} terakhir)</span>
        </h2>
        {logs.length === 0 ? (
          <p className="rounded-lg bg-paper p-3 text-sm text-muted">Belum ada percobaan replace.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted uppercase">
                <tr>
                  <th className="py-2 pr-3 font-medium">Waktu</th>
                  <th className="py-2 pr-3 font-medium">IP lama</th>
                  <th className="py-2 pr-3 font-medium">Negara</th>
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
                      {log.new_country === "ANY" ? "🎲 Acak" : `${countryFlag(log.new_country)} ${log.new_country}`}
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
    </div>
  );
}
