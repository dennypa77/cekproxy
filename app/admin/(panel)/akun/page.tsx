import Link from "next/link";
import { deleteAccountAction, toggleAccountDisabledAction } from "@/app/admin/actions";
import { AccountBandwidth } from "@/components/admin/AccountBandwidth";
import { AddAccountForm, BulkImportForm } from "@/components/admin/AccountForms";
import { ActionButton } from "@/components/admin/ActionButton";
import { Badge, buttonClass, Card } from "@/components/ui";
import { db, type AccountStatus } from "@/lib/db";
import { maskSecret } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Pool Akun" };
// Validasi / bulk import memanggil API untuk setiap key.
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
      <h1 className="text-xl font-bold text-ink">Pool Akun</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-ink">Tambah akun</h2>
          <AddAccountForm />
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold text-ink">Bulk import</h2>
          <BulkImportForm />
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold text-ink">
          Daftar akun <span className="font-normal text-muted">({accounts.length})</span>
        </h2>
        {accounts.length === 0 ? (
          <p className="rounded-lg bg-paper p-3 text-sm text-muted">Belum ada akun.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted uppercase">
                <tr>
                  <th className="py-2 pr-3 font-medium">Label</th>
                  <th className="py-2 pr-3 font-medium">API key</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Pesanan</th>
                  <th className="py-2 pr-3 font-medium">Bandwidth</th>
                  <th className="py-2 text-right font-medium">Aksi</th>
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
                        <Badge tone={badge.tone}>{badge.label}</Badge>
                      </td>
                      <td className="py-2.5 pr-3">
                        {order ? (
                          <Link href={`/admin/pesanan/${order.id}`} className="font-mono text-brand-deep hover:underline">
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
                          <Link href={`/admin/akun/${account.id}`} className={buttonClass("secondary", "xs")}>
                            Edit
                          </Link>
                          <ActionButton
                            action={toggleAccountDisabledAction.bind(null, account.id)}
                            disabled={account.status === "assigned"}
                            title={account.status === "assigned" ? "Lepas akun dari pesanan terlebih dahulu" : undefined}
                          >
                            {account.status === "disabled" ? "Aktifkan" : "Nonaktifkan"}
                          </ActionButton>
                          <ActionButton
                            action={deleteAccountAction.bind(null, account.id)}
                            variant="dangerSoft"
                            disabled={Boolean(order) || account.status === "assigned"}
                            title={order ? "Akun masih tertaut ke pesanan" : undefined}
                            confirm={`Hapus akun "${account.label}"? Tindakan ini tidak bisa dibatalkan.`}
                          >
                            Hapus
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
