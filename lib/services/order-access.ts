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
 * Yang menentukan adalah TANGGAL PESANAN DIBUAT, bukan tanggal hari ini.
 * Pesanan yang dibuat sebelum CUSTOMER_LOGIN_REQUIRED_FROM selamanya "allow":
 * customer lama cukup mengetik nomor pesanan seperti biasa, tanpa akun, dan
 * tidak akan pernah terkunci. Kewajiban punya akun hanya berlaku untuk
 * pesanan yang dibuat sejak tanggal itu.
 */
export type OrderGate = "allow" | "login" | "claim" | "other";

export interface OrderAccess {
  gate: OrderGate;
  customer: Customer | null;
  /** Pesanan ini memang milik akun yang sedang masuk. */
  mine: boolean;
  /**
   * Tanggal (ISO) mulai pesanan BARU wajib dibuka lewat akun, null kalau
   * belum ditetapkan. Pesanan yang sedang dibuka sendiri tidak terpengaruh
   * kalau dibuat sebelum tanggal ini.
   */
  enforceFrom: string | null;
}

export function loginRequiredFromIso(): string | null {
  const date = customerLoginRequiredFrom();
  return date ? startOfJakartaDay(date) : null;
}

/**
 * Apakah pesanan ini wajib dibuka lewat akun?
 *
 * Dibandingkan dengan created_at pesanan, bukan dengan jam sekarang — jadi
 * jawabannya tetap sama sepanjang umur pesanan itu. Pesanan lama tidak
 * berubah aturannya hanya karena waktu berjalan.
 */
export function loginRequiredForOrder(order: Pick<Order, "created_at">): boolean {
  const iso = loginRequiredFromIso();
  if (iso === null) return false;
  const dibuat = Date.parse(order.created_at);
  if (Number.isNaN(dibuat)) return false; // tanggal aneh → jangan kunci customer
  return dibuat >= Date.parse(iso);
}

export async function resolveOrderAccess(order: Order): Promise<OrderAccess> {
  const customer = await getCustomer();
  const mine = Boolean(customer && order.customer_id === customer.id);
  const enforceFrom = loginRequiredFromIso();

  if (mine) return { gate: "allow", customer, mine, enforceFrom };
  if (!loginRequiredForOrder(order)) return { gate: "allow", customer, mine, enforceFrom };
  if (!customer) return { gate: "login", customer, mine, enforceFrom };
  return { gate: order.customer_id ? "other" : "claim", customer, mine, enforceFrom };
}
