import { FollowUpRow } from "@/components/admin/FollowUpRow";
import { Badge, Card } from "@/components/ui";
import { db, type WaTemplate } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { listFollowUps } from "@/lib/services/followup";
import { formatWaNumber } from "@/lib/wa-number";

export const metadata = { title: "Follow Up" };

const TEMPLATE_LABEL: Record<WaTemplate, string> = {
  claim_code: "Kode klaim",
  expiry_h3: "Pengingat 3 hari",
  expiry_h1: "Pengingat 1 hari",
  expired: "Sudah expired",
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
      <h1 className="text-xl font-bold text-ink">Follow Up WhatsApp</h1>

      <Card>
        <h2 className="font-semibold text-ink">
          Perlu dihubungi <span className="font-normal text-muted">({belum.length})</span>
        </h2>
        <p className="mt-1 mb-4 max-w-3xl text-sm text-muted">
          Semua pesan dikirim manual dari nomor WhatsApp Anda sendiri, jadi balasan customer tetap masuk ke chat yang
          biasa. Tombol <b>Chat</b> membuka WhatsApp dengan pesan yang sudah terisi — tinggal periksa lalu kirim,
          setelah itu klik <b>Tandai sudah</b> supaya tidak terkirim dua kali.
        </p>

        {rows.length === 0 ? (
          <p className="rounded-lg bg-paper p-3 text-sm text-muted">
            Tidak ada yang perlu dihubungi hari ini. Daftar ini terisi otomatis saat ada pesanan mendekati expired,
            baru lewat masa aktif, atau kode klaimnya belum dipakai.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted uppercase">
                <tr>
                  <th className="py-2 pr-3 font-medium">Pesanan</th>
                  <th className="py-2 pr-3 font-medium">Alasan</th>
                  <th className="py-2 pr-3 font-medium">Nomor WhatsApp</th>
                  <th className="py-2 text-right font-medium">Aksi</th>
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
        <h2 className="mb-1 font-semibold text-ink">Riwayat follow-up</h2>
        <p className="mb-3 text-sm text-muted">
          Catatan siapa saja yang sudah Anda hubungi, supaya tidak dobel saat pesanan dibuka lagi besok.
        </p>
        {riwayat.length === 0 ? (
          <p className="rounded-lg bg-paper p-3 text-sm text-muted">Belum ada follow-up yang ditandai.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted uppercase">
                <tr>
                  <th className="py-2 pr-3 font-medium">Waktu</th>
                  <th className="py-2 pr-3 font-medium">Pesanan</th>
                  <th className="py-2 pr-3 font-medium">Nomor</th>
                  <th className="py-2 pr-3 font-medium">Jenis</th>
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
                      <Badge tone="green">sudah dikirim</Badge>
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
