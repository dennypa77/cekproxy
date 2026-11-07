import { DAY_MS } from "./format";

export const EXPIRING_SOON_DAYS = 3;

export type OrderState = "aktif" | "akan_expired" | "expired" | "nonaktif";
export type OrderFilter = "semua" | OrderState;

export const ORDER_FILTERS: { value: OrderFilter; label: string }[] = [
  { value: "semua", label: "All" },
  { value: "aktif", label: "Active" },
  { value: "akan_expired", label: "Expiring soon (≤3 days)" },
  { value: "expired", label: "Expired" },
  { value: "nonaktif", label: "Inactive" },
];

export function orderState(order: { is_active: boolean; expires_at: string }, now = Date.now()): OrderState {
  if (!order.is_active) return "nonaktif";
  const expiresAt = new Date(order.expires_at).getTime();
  if (expiresAt <= now) return "expired";
  if (expiresAt - now <= EXPIRING_SOON_DAYS * DAY_MS) return "akan_expired";
  return "aktif";
}

export function matchesFilter(order: { is_active: boolean; expires_at: string }, filter: OrderFilter, now = Date.now()) {
  const state = orderState(order, now);
  switch (filter) {
    case "semua":
      return true;
    case "aktif":
      return state === "aktif" || state === "akan_expired";
    case "expired":
      return order.is_active ? state === "expired" : new Date(order.expires_at).getTime() <= now;
    default:
      return state === filter;
  }
}
