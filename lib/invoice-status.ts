import type { InvoiceStatus } from "./db/types";

/** Label + warna badge per status invoice (dipakai customer & admin). */
export const INVOICE_BADGE: Record<InvoiceStatus, { tone: "green" | "yellow" | "red" | "blue" | "gray"; label: string }> = {
  menunggu_bayar: { tone: "blue", label: "Menunggu pembayaran" },
  menunggu_verifikasi: { tone: "yellow", label: "Menunggu verifikasi" },
  disetujui: { tone: "green", label: "Selesai" },
  ditolak: { tone: "red", label: "Ditolak" },
  kedaluwarsa: { tone: "gray", label: "Kedaluwarsa" },
  dibatalkan: { tone: "gray", label: "Dibatalkan" },
};

export const INVOICE_AKTIF: InvoiceStatus[] = ["menunggu_bayar", "menunggu_verifikasi"];

export type InvoiceFilter = "perlu_verifikasi" | "aktif" | "selesai" | "semua";

export const INVOICE_FILTERS: { value: InvoiceFilter; label: string }[] = [
  { value: "perlu_verifikasi", label: "Perlu verifikasi" },
  { value: "aktif", label: "Belum selesai" },
  { value: "selesai", label: "Selesai" },
  { value: "semua", label: "Semua" },
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
