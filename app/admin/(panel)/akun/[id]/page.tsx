import Link from "next/link";
import { notFound } from "next/navigation";
import { checkAccountAction, updateAccountAction } from "@/app/admin/actions";
import { AccountBandwidth } from "@/components/admin/AccountBandwidth";
import { ActionButton } from "@/components/admin/ActionButton";
import { EditAccountForm } from "@/components/admin/EditAccountForm";
import { ChevronLeftIcon } from "@/components/icons";
import { Badge, Card } from "@/components/ui";
import { db } from "@/lib/db";
import { formatDateTime, maskSecret } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Edit Akun" };
export const maxDuration = 60;

export default async function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const repo = db();
  const account = await repo.getAccount(id);
  if (!account) notFound();
  const order = (await repo.listOrders()).find((o) => o.account_id === id);

  return (
    <div className="max-w-2xl space-y-4">
      <Link href="/admin/akun" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeftIcon className="size-4" /> Kembali ke pool akun
      </Link>

      <Card>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-ink">{account.label}</h1>
            <p className="text-sm text-muted">
              Dibuat {formatDateTime(account.created_at)} · <Badge>{account.status}</Badge>
            </p>
            <p className="mt-1 text-sm">
              Pesanan:{" "}
              {order ? (
                <Link href={`/admin/pesanan/${order.id}`} className="font-mono text-brand-deep hover:underline">
                  {order.shopee_order_no}
                </Link>
              ) : (
                "-"
              )}
            </p>
            <p className="mt-1 text-sm">
              Bandwidth: <AccountBandwidth accountId={account.id} />
            </p>
          </div>
          <ActionButton action={checkAccountAction.bind(null, account.id)} size="sm">
            Cek ulang API key
          </ActionButton>
        </div>

        <EditAccountForm
          action={updateAccountAction.bind(null, account.id)}
          account={{
            label: account.label,
            email: account.email,
            catatan: account.catatan,
            maskedKey: maskSecret(account.api_key),
          }}
        />
      </Card>
    </div>
  );
}
