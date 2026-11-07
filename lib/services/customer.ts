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
  /** null untuk pesanan rotating (tidak menempel ke satu akun). */
  account: WebshareAccount | null;
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

  const timing = { expired: now >= expiresAt, daysLeft: computeDaysLeft(order.expires_at, now) };

  // Pesanan rotating memakai pool gabungan, jadi tidak perlu akun tertaut.
  if (order.order_type === "rotating") {
    return { ok: true, ctx: { order, account: null, ...timing } };
  }

  if (!order.account_id) return { ok: false, reason: "no_account" };
  const account = await repo.getAccount(order.account_id);
  if (!account || account.status === "disabled") return { ok: false, reason: "no_account" };

  return { ok: true, ctx: { order, account, ...timing } };
}

export const ACCESS_MESSAGES: Record<AccessDeniedReason, { title: string; body: string; icon: StatusIconName }> = {
  not_found: {
    icon: "search",
    title: "Order number not found",
    body: "Please make sure the order number is correct. If you just placed your order, please wait while we process it.",
  },
  inactive: {
    icon: "pause",
    title: "Order is not active",
    body: "This order is currently disabled. Please contact us on WhatsApp for more information.",
  },
  expired_long: {
    icon: "clock",
    title: "Validity ended a while ago",
    body: "The proxy validity for this order ended more than 7 days ago. Contact us on WhatsApp to order again.",
  },
  no_account: {
    icon: "tool",
    title: "Order is being set up",
    body: "The proxies for this order are being set up. Please check back in a little while or contact us on WhatsApp.",
  },
};
