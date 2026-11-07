import type { InvoiceStatus } from "./db/types";

/** Label + warna badge per status invoice (dipakai customer & admin). */
export const INVOICE_BADGE: Record<InvoiceStatus, { tone: "green" | "yellow" | "red" | "blue" | "gray"; label: string }> = {
  menunggu_bayar: { tone: "blue", label: "Awaiting payment" },
  menunggu_verifikasi: { tone: "yellow", label: "Checking payment" },
  disetujui: { tone: "green", label: "Completed" },
  ditolak: { tone: "red", label: "Rejected" },
  kedaluwarsa: { tone: "gray", label: "Expired" },
  dibatalkan: { tone: "gray", label: "Canceled" },
};

export const INVOICE_AKTIF: InvoiceStatus[] = ["menunggu_bayar", "menunggu_verifikasi"];

export type InvoiceFilter = "perlu_verifikasi" | "aktif" | "selesai" | "semua";

export const INVOICE_FILTERS: { value: InvoiceFilter; label: string }[] = [
  { value: "perlu_verifikasi", label: "Needs checking" },
  { value: "aktif", label: "Open" },
  { value: "selesai", label: "Completed" },
  { value: "semua", label: "All" },
];

export function cocokFilter(status: InvoiceStatus, filter: InvoiceFilter): boolean {
  switch (filter) {
    case "perlu_verifikasi":
      return status === "menunggu_verifikasi";
    case "aktif":
      return INVOICE_AKTIF.includes(status);
    case "selesai":
      return status === "disetujui";
    default:
      return true;
  }
}
