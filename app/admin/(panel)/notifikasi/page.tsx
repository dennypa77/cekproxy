import { previewNotificationsAction, sendNotificationsAction } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/ActionButton";
import { Badge, Card } from "@/components/ui";
import { db, type WaTemplate } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { formatWaNumber } from "@/lib/wa-number";
import { waSenderEnabled } from "@/lib/wa-sender";

export const metadata = { title: "Notifikasi" };
export const maxDuration = 60;

const TEMPLATE_LABEL: Record<WaTemplate, string> = {
  claim_code: "Kode klaim",
  expiry_h3: "Pengingat 3 hari",
  expiry_h1: "Pengingat 1 hari",
  expired: "Sudah expired",
  manual: "Manual",
};

export default async function NotifikasiPage() {
  await requireAdmin();
  const repo = db();
  const [messages, orders] = await Promise.all([repo.listWaMessages(100), repo.listOrders()]);
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const aktif = waSenderEnabled();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">Notifikasi WhatsApp</h1>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <h2 className="font-semibold text-ink">
              Status pengiriman <Badge tone={aktif ? "green" : "gray"}>{aktif ? "aktif" : "belum aktif"}</Badge>
            </h2>
            <p className="mt-1 text-sm text-muted">
              {aktif
                ? "Pengingat dikirim otomatis sekali sehari: 3 hari sebelum expired, 1 hari sebelum, dan saat pesanan berakhir. Satu pesanan hanya menerima satu pesan per jenis."
                : "Isi FONNTE_TOKEN di environment variable Vercel untuk mengaktifkan pengiriman otomatis. Tanpa itu, tombol di bawah hanya menampilkan simulasi."}
            </p>
            <p className="mt-2 text-xs text-muted">
              Pengingat memakai nomor WhatsApp akun customer; kalau pesanan belum diklaim, dipakai nomor yang dicatat
              di pesanan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton action={previewNotificationsAction} size="sm">
              Simulasi (tanpa kirim)
            </ActionButton>
            <ActionButton
              action={sendNotificationsAction}
              variant="primary"
              size="sm"
              disabled={!aktif}
              confirm="Jalankan putaran notifikasi sekarang? Pesan akan benar-benar dikirim ke customer."
            >
              Kirim sekarang
            </ActionButton>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-ink">
          Riwayat pengiriman <span className="font-normal text-muted">({messages.length} terakhir)</span>
        </h2>
        {messages.length === 0 ? (
          <p className="rounded-lg bg-paper p-3 text-sm text-muted">Belum ada pesan yang dikirim.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted uppercase">
                <tr>
                  <th className="py-2 pr-3 font-medium">Waktu</th>
                  <th className="py-2 pr-3 font-medium">Pesanan</th>
                  <th className="py-2 pr-3 font-medium">Nomor</th>
                  <th className="py-2 pr-3 font-medium">Jenis</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {messages.map((message) => (
                  <tr key={message.id} className="align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDateTime(message.created_at)}</td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {message.order_id ? (orderById.get(message.order_id)?.shopee_order_no ?? "-") : "-"}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatWaNumber(message.to_number)}</td>
                    <td className="py-2 pr-3">{TEMPLATE_LABEL[message.template]}</td>
                    <td className="py-2 pr-3">
                      <Badge tone={message.status === "sent" ? "green" : "red"}>{message.status}</Badge>
                    </td>
                    <td className="py-2 text-xs break-all text-muted">{message.error ?? "-"}</td>
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
