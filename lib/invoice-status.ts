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

/**
 * Label status invoice untuk CUSTOMER, mengikuti bahasa halaman.
 *
 * INVOICE_BADGE di atas tetap dipakai panel admin — panel itu di luar
 * segmen [lang] dan sengaja berbahasa Inggris, jadi labelnya tidak boleh
 * ikut berubah.
 */
export function labelInvoice(
  k: { invoiceStatus: Record<string, string> },
  status: InvoiceStatus,
): string {
  const peta: Record<InvoiceStatus, string> = {
    menunggu_bayar: k.invoiceStatus.menungguBayar,
    menunggu_verifikasi: k.invoiceStatus.menungguVerifikasi,
    disetujui: k.invoiceStatus.disetujui,
    ditolak: k.invoiceStatus.ditolak,
    kedaluwarsa: k.invoiceStatus.kedaluwarsa,
    dibatalkan: k.invoiceStatus.dibatalkan,
  };
  return peta[status];
}
