import "server-only";
import { db, type Order, type WebshareAccount } from "../db";
import { daysLeft as computeDaysLeft, DAY_MS } from "../format";
import { orderNoSchema } from "../order-no";
import type { StatusIconName } from "../public-types";

/** Setelah expired, halaman pesanan masih bisa dibuka selama 7 hari. */
export const GRACE_DAYS = 7;

export type AccessDeniedReason = "not_found" | "inactive" | "expired_long" | "no_account";

export interface CustomerContext {
  order: Order;
  account: WebshareAccount;
  expired: boolean;
  daysLeft: number;
}

export type CustomerAccess = { ok: true; ctx: CustomerContext } | { ok: false; reason: AccessDeniedReason };

export async function resolveCustomerOrder(rawOrderNo: string): Promise<CustomerAccess> {
  const parsed = orderNoSchema.safeParse(rawOrderNo);
  if (!parsed.success) return { ok: false, reason: "not_found" };

  const repo = db();
  const order = await repo.getOrderByNo(parsed.data);
  if (!order) return { ok: false, reason: "not_found" };
  if (!order.is_active) return { ok: false, reason: "inactive" };

  const expiresAt = new Date(order.expires_at).getTime();
  const now = Date.now();
  if (now > expiresAt + GRACE_DAYS * DAY_MS) return { ok: false, reason: "expired_long" };

  if (!order.account_id) return { ok: false, reason: "no_account" };
  const account = await repo.getAccount(order.account_id);
  if (!account || account.status === "disabled") return { ok: false, reason: "no_account" };

  return {
    ok: true,
    ctx: { order, account, expired: now >= expiresAt, daysLeft: computeDaysLeft(order.expires_at, now) },
  };
}

export const ACCESS_MESSAGES: Record<AccessDeniedReason, { title: string; body: string; icon: StatusIconName }> = {
  not_found: {
    icon: "search",
    title: "Nomor pesanan tidak ditemukan",
    body: "Pastikan nomor pesanan sudah benar (lihat di aplikasi Shopee → Saya → Pesanan Saya). Jika Anda baru saja membeli, mohon tunggu admin memproses pesanan Anda.",
  },
  inactive: {
    icon: "pause",
    title: "Pesanan sedang tidak aktif",
    body: "Pesanan ini sedang dinonaktifkan. Silakan hubungi admin via WhatsApp untuk informasi lebih lanjut.",
  },
  expired_long: {
    icon: "clock",
    title: "Masa aktif sudah lama berakhir",
    body: "Masa aktif proxy untuk pesanan ini sudah berakhir lebih dari 7 hari. Silakan order kembali melalui toko Shopee kami.",
  },
  no_account: {
    icon: "tool",
    title: "Pesanan sedang disiapkan",
    body: "Proxy untuk pesanan ini sedang disiapkan oleh admin. Silakan cek kembali beberapa saat lagi atau hubungi admin via WhatsApp.",
  },
};
