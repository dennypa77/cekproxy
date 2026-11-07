import { FollowUpRow } from "@/components/admin/FollowUpRow";
import { Badge, Card } from "@/components/ui";
import { db, type WaTemplate } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { listFollowUps } from "@/lib/services/followup";
import { formatWaNumber } from "@/lib/wa-number";

export const metadata = { title: "Follow Up" };

const TEMPLATE_LABEL: Record<WaTemplate, string> = {
  claim_code: "Claim code",
  expiry_h3: "3-day reminder",
  expiry_h1: "1-day reminder",
  expired: "Expired",
  manual: "Manual",
};

export default async function FollowUpPage() {
  await requireAdmin();
  const [rows, riwayat, orders] = await Promise.all([
    listFollowUps(),
    db().listWaMessages(50),
    db().listOrders(),
  ]);
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const belum = rows.filter((r) => !r.sudahDihubungi);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">WhatsApp Follow-up</h1>

      <Card>
        <h2 className="font-semibold text-ink">
          Needs contacting <span className="font-normal text-muted">({belum.length})</span>
        </h2>
        <p className="mt-1 mb-4 max-w-3xl text-sm text-muted">
          Every message is sent manually from your own WhatsApp number, so customer replies still land in your usual
          chat. The <b>Chat</b> button opens WhatsApp with a pre-filled message — just review and send, then click
          <b>Mark done</b> so it isn't sent twice.
        </p>

        {rows.length === 0 ? (
          <p className="rounded-lg bg-paper p-3 text-sm text-muted">
            Nothing to contact today. This list fills in automatically when an order is nearing expiry,
            has just passed its validity, or its claim code hasn't been used.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted uppercase">
                <tr>
                  <th className="py-2 pr-3 font-medium">Order</th>
                  <th className="py-2 pr-3 font-medium">Reason</th>
                  <th className="py-2 pr-3 font-medium">WhatsApp number</th>
                  <th className="py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <FollowUpRow key={`${row.orderId}-${row.template}`} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-ink">Follow-up history</h2>
        <p className="mb-3 text-sm text-muted">
          A record of who you've already contacted, so you don't double up when an order is reopened tomorrow.
        </p>
        {riwayat.length === 0 ? (
          <p className="rounded-lg bg-paper p-3 text-sm text-muted">No follow-ups have been marked yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted uppercase">
                <tr>
                  <th className="py-2 pr-3 font-medium">Time</th>
                  <th className="py-2 pr-3 font-medium">Order</th>
                  <th className="py-2 pr-3 font-medium">Number</th>
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {riwayat.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDateTime(item.created_at)}</td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {item.order_id ? (orderById.get(item.order_id)?.shopee_order_no ?? "-") : "-"}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatWaNumber(item.to_number)}</td>
                    <td className="py-2 pr-3">{TEMPLATE_LABEL[item.template]}</td>
                    <td className="py-2">
                      <Badge tone="green">sent</Badge>
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
