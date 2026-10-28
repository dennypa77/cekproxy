import Link from "next/link";
import { bulkGenerateClaimCodesAction, resetCustomerPasswordAction, toggleCustomerBlockedAction } from "@/app/admin/actions";
import { ActionButton } from "@/components/admin/ActionButton";
import { WhatsAppIcon } from "@/components/icons";
import { Badge, buttonClass, Card } from "@/components/ui";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { waTo } from "@/lib/links";
import { requireAdmin } from "@/lib/session";
import { formatWaNumber } from "@/lib/wa-number";

export const metadata = { title: "Customer" };

export default async function CustomerPage() {
  await requireAdmin();
  const repo = db();
  const [customers, orders] = await Promise.all([repo.listCustomers(), repo.listOrders()]);

  const jumlahPesanan = new Map<string, number>();
  for (const order of orders) {
    if (order.customer_id) jumlahPesanan.set(order.customer_id, (jumlahPesanan.get(order.customer_id) ?? 0) + 1);
  }
  const belumDiklaim = orders.filter((o) => o.is_active && !o.customer_id);
  const belumPunyaKode = belumDiklaim.filter((o) => !o.claim_code);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">Customer</h1>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-ink">Siapkan kode klaim massal</h2>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Membuat kode klaim untuk semua pesanan aktif yang belum diklaim ({belumPunyaKode.length} pesanan belum
              punya kode). Kodenya dikirim per pesanan lewat halaman Kelola pesanan.
            </p>
          </div>
          <ActionButton
            action={bulkGenerateClaimCodesAction}
            size="sm"
            disabled={belumPunyaKode.length === 0}
            confirm={`Buat kode klaim untuk ${belumPunyaKode.length} pesanan?`}
          >
            Buat kode klaim massal
          </ActionButton>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-ink">
          Akun terdaftar <span className="font-normal text-muted">({customers.length})</span>
        </h2>

        {customers.length === 0 ? (
          <p className="rounded-lg bg-paper p-3 text-sm text-muted">
            Belum ada customer yang mendaftar. Kirimkan link halaman utama dan kode klaim lewat WhatsApp.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted uppercase">
                <tr>
                  <th className="py-2 pr-3 font-medium">Nama</th>
                  <th className="py-2 pr-3 font-medium">WhatsApp</th>
                  <th className="py-2 pr-3 font-medium">Pesanan</th>
                  <th className="py-2 pr-3 font-medium">Terdaftar</th>
                  <th className="py-2 pr-3 font-medium">Terakhir masuk</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {customers.map((customer) => (
                  <tr key={customer.id} className="align-top">
                    <td className="py-2.5 pr-3 font-medium text-ink">{customer.nama}</td>
                    <td className="py-2.5 pr-3">
                      <a
                        href={waTo(customer.wa_number, `Halo ${customer.nama},`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-brand-deep hover:underline"
                      >
                        <WhatsAppIcon className="size-3.5" /> {formatWaNumber(customer.wa_number)}
                      </a>
                    </td>
                    <td className="py-2.5 pr-3">{jumlahPesanan.get(customer.id) ?? 0}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">{formatDateTime(customer.created_at)}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      {customer.last_login_at ? formatDateTime(customer.last_login_at) : "-"}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge tone={customer.is_blocked ? "red" : "green"}>
                        {customer.is_blocked ? "diblokir" : "aktif"}
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      <div className="flex justify-end gap-1.5">
                        <ActionButton
                          action={resetCustomerPasswordAction.bind(null, customer.id)}
                          confirm={`Reset password ${customer.nama}? Password lama langsung tidak berlaku dan semua perangkatnya keluar.`}
                        >
                          Reset password
                        </ActionButton>
                        <ActionButton
                          action={toggleCustomerBlockedAction.bind(null, customer.id)}
                          variant={customer.is_blocked ? "secondary" : "dangerSoft"}
                          confirm={
                            customer.is_blocked
                              ? undefined
                              : `Blokir ${customer.nama}? Akunnya langsung keluar dan tidak bisa masuk lagi.`
                          }
                        >
                          {customer.is_blocked ? "Buka blokir" : "Blokir"}
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold text-ink">
          Pesanan aktif yang belum diklaim <span className="font-normal text-muted">({belumDiklaim.length})</span>
        </h2>
        <p className="mb-3 text-sm text-muted">
          Pesanan ini belum masuk ke akun customer mana pun. Buka halaman kelolanya untuk mengirim kode klaim.
        </p>
        {belumDiklaim.length === 0 ? (
          <p className="rounded-lg bg-paper p-3 text-sm text-muted">Semua pesanan aktif sudah diklaim.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {belumDiklaim.map((order) => (
              <li key={order.id}>
                <Link href={`/admin/pesanan/${order.id}`} className={buttonClass("secondary", "xs")}>
                  <span className="font-mono">{order.shopee_order_no}</span>
                  {order.claim_code ? " · ada kode" : " · belum ada kode"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
