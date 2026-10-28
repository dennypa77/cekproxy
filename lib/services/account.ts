import "server-only";
import { db, type Order } from "../db";
import { daysLeft as computeDaysLeft, DAY_MS } from "../format";
import { customerPlanLabel } from "../plan-type";
import { orderState, type OrderState } from "../order-status";
import { GRACE_DAYS } from "./customer";

export interface AccountOrderRow {
  order: Order;
  state: OrderState;
  daysLeft: number;
  /** "Datacenter" | "Residential" | "Rotating" | null kalau belum disiapkan. */
  jenis: string | null;
  /** Halaman pesanan masih bisa dibuka (belum lewat masa tenggang). */
  openable: boolean;
}

/** Semua pesanan milik satu akun customer, siap dirender. */
export async function listAccountOrders(customerId: string): Promise<AccountOrderRow[]> {
  const repo = db();
  const orders = await repo.listOrdersByCustomer(customerId);
  if (orders.length === 0) return [];

  // Satu query akun untuk semua pesanan (hindari N+1).
  const accounts = await repo.listAccounts();
  const accountById = new Map(accounts.map((a) => [a.id, a]));
  const now = Date.now();

  return orders
    .map((order) => {
      const account = order.account_id ? accountById.get(order.account_id) : undefined;
      const graceEnds = new Date(order.expires_at).getTime() + GRACE_DAYS * DAY_MS;
      return {
        order,
        state: orderState(order, now),
        daysLeft: computeDaysLeft(order.expires_at, now),
        jenis: order.order_type === "rotating" ? "Rotating" : (account ? customerPlanLabel(account) : null),
        openable: order.is_active && now <= graceEnds,
      };
    })
    .sort((a, b) => {
      // Aktif dulu, lalu yang paling dekat expired.
      const aktifA = a.state === "aktif" || a.state === "akan_expired";
      const aktifB = b.state === "aktif" || b.state === "akan_expired";
      if (aktifA !== aktifB) return aktifA ? -1 : 1;
      return a.order.expires_at.localeCompare(b.order.expires_at);
    });
}
