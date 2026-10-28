import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/components/customer/account/AccountShell";
import { ServicePill } from "@/components/Brand";
import { ServerIcon, WhatsAppIcon } from "@/components/icons";
import { Badge, buttonClass, Card } from "@/components/ui";
import { requireCustomer } from "@/lib/customer-session";
import { formatDate } from "@/lib/format";
import { customerPath, waExtendLink, waHelpLink } from "@/lib/links";
import type { OrderState } from "@/lib/order-status";
import { listAccountOrders } from "@/lib/services/account";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pesanan Saya" };

const STATE_BADGE: Record<OrderState, { tone: "green" | "yellow" | "red" | "gray"; label: string }> = {
  aktif: { tone: "green", label: "Aktif" },
  akan_expired: { tone: "yellow", label: "Segera expired" },
  expired: { tone: "red", label: "Expired" },
  nonaktif: { tone: "gray", label: "Nonaktif" },
};

export default async function AkunPage() {
  const customer = await requireCustomer();
  const rows = await listAccountOrders(customer.id);

  return (
    <AccountShell
      nama={customer.nama}
      action={
        <Link href="/akun/klaim" className={buttonClass("primary", "sm")}>
          + Klaim pesanan
        </Link>
      }
    >
      {rows.length === 0 ? (
        <Card>
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">
            Belum ada <span className="text-brand">pesanan</span>
          </h2>
          <p className="mt-2 text-sm text-muted">
            Sudah memesan? Minta kode klaim ke admin lewat WhatsApp, lalu masukkan kodenya di sini untuk menambahkan
            pesanan ke akun Anda.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/akun/klaim" className={buttonClass("primary", "md")}>
              Klaim pesanan dengan kode
            </Link>
            <a
              href={waHelpLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("secondary", "md")}
            >
              <WhatsAppIcon className="size-4" /> Minta kode ke admin
            </a>
          </div>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted">
            {rows.length} pesanan di akun ini. Klik salah satu untuk melihat daftar proxy, bandwidth, dan pengaturannya.
          </p>

          {rows.map(({ order, state, daysLeft, jenis, openable }) => {
            const badge = STATE_BADGE[state];
            return (
              <Card key={order.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-lg font-bold break-all text-ink">{order.shopee_order_no}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                      {jenis && (
                        <Badge tone="blue">
                          <ServerIcon className="size-3.5" /> {jenis}
                        </Badge>
                      )}
                      {order.nama_customer && <Badge>{order.nama_customer}</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {state === "expired" || state === "nonaktif"
                        ? `Berakhir ${formatDate(order.expires_at)}`
                        : `Berlaku sampai ${formatDate(order.expires_at)} · ${daysLeft} hari lagi`}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    {openable ? (
                      <Link href={customerPath(order.shopee_order_no)} className={buttonClass("primary", "sm")}>
                        Buka dashboard →
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold text-muted">Halaman pesanan sudah ditutup</span>
                    )}
                    <a
                      href={waExtendLink(order.shopee_order_no, formatDate(order.expires_at))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClass("secondary", "sm")}
                    >
                      <WhatsAppIcon className="size-4" /> Perpanjang
                    </a>
                  </div>
                </div>
              </Card>
            );
          })}
        </>
      )}

      <div className="flex flex-col items-center gap-3 pt-4">
        <a href={waHelpLink()} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
          <WhatsAppIcon className="size-4" /> Butuh bantuan? Chat admin
        </a>
        <ServicePill />
      </div>
    </AccountShell>
  );
}
