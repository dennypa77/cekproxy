import "server-only";
import { getCustomer } from "../customer-session";
import type { Customer, Order } from "../db";
import { customerLoginRequiredFrom } from "../env";
import { startOfJakartaDay } from "../format";

/**
 * Aturan akses halaman pesanan.
 *
 * - "allow"  : boleh dibuka.
 * - "login"  : wajib masuk dulu.
 * - "claim"  : sudah masuk, tapi pesanan ini belum diklaim siapa pun.
 * - "other"  : pesanan milik akun lain.
 *
 * Sebelum tanggal CUSTOMER_LOGIN_REQUIRED_FROM semuanya "allow" (masa
 * transisi), supaya customer lama yang memegang link tidak langsung terkunci.
 */
export type OrderGate = "allow" | "login" | "claim" | "other";

export interface OrderAccess {
  gate: OrderGate;
  customer: Customer | null;
  /** Pesanan ini memang milik akun yang sedang masuk. */
  mine: boolean;
  /** Tanggal (ISO) mulai login diwajibkan, null kalau belum ditetapkan. */
  enforceFrom: string | null;
}

export function loginRequiredFromIso(): string | null {
  const date = customerLoginRequiredFrom();
  return date ? startOfJakartaDay(date) : null;
}

export function loginRequiredNow(now = Date.now()): boolean {
  const iso = loginRequiredFromIso();
  return iso !== null && now >= Date.parse(iso);
}

export async function resolveOrderAccess(order: Order, now = Date.now()): Promise<OrderAccess> {
  const customer = await getCustomer();
  const mine = Boolean(customer && order.customer_id === customer.id);
  const enforceFrom = loginRequiredFromIso();

  if (mine) return { gate: "allow", customer, mine, enforceFrom };
  if (!loginRequiredNow(now)) return { gate: "allow", customer, mine, enforceFrom };
  if (!customer) return { gate: "login", customer, mine, enforceFrom };
  return { gate: order.customer_id ? "other" : "claim", customer, mine, enforceFrom };
}
