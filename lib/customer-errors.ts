import "server-only";
import { WebshareError } from "./webshare-types";

export type CustomerOperation =
  | "bandwidth"
  | "proxies"
  | "countries"
  | "replace"
  | "whitelist_list"
  | "whitelist_add"
  | "whitelist_delete";

const DEFAULTS: Record<CustomerOperation, string> = {
  bandwidth: "Data bandwidth sedang tidak tersedia.",
  proxies: "Daftar proxy belum bisa dimuat. Silakan coba lagi beberapa saat lagi.",
  countries: "Daftar negara belum bisa dimuat. Anda tetap bisa memilih negara Acak.",
  replace: "Replace IP gagal diproses. Kuota Anda tidak berkurang. Silakan coba lagi.",
  whitelist_list: "Daftar IP whitelist belum bisa dimuat. Silakan coba lagi.",
  whitelist_add: "IP belum bisa ditambahkan. Silakan coba lagi.",
  whitelist_delete: "IP belum bisa dihapus. Silakan coba lagi.",
};

/**
 * Ubah error apa pun menjadi pesan bersih untuk customer.
 * Tidak pernah menyertakan nama penyedia, URL API, atau pesan mentah upstream.
 * Error asli dicatat ke log server.
 */
export function customerErrorMessage(error: unknown, operation: CustomerOperation): string {
  console.error(`[customer:${operation}]`, error);

  if (!(error instanceof WebshareError)) return DEFAULTS[operation];

  switch (error.kind) {
    case "auth":
      return "Layanan proxy untuk pesanan ini sedang bermasalah. Silakan hubungi admin via WhatsApp.";
    case "rate_limited":
      return "Server sedang sibuk. Silakan coba lagi dalam 1 menit.";
    case "network":
    case "timeout":
    case "upstream":
      return "Server proxy sedang lambat atau tidak dapat dihubungi. Silakan coba lagi beberapa saat lagi.";
    case "bad_request": {
      if (operation === "whitelist_add") {
        const raw = `${error.message} ${JSON.stringify(error.detail ?? "")}`.toLowerCase();
        if (raw.includes("already") || raw.includes("exist") || raw.includes("unique")) {
          return "IP ini sudah ada di daftar whitelist.";
        }
        if (raw.includes("max") || raw.includes("limit")) {
          return "Batas jumlah IP whitelist sudah tercapai. Hapus salah satu IP terlebih dahulu.";
        }
        return "IP tidak dapat ditambahkan. Pastikan IP yang dimasukkan benar.";
      }
      return DEFAULTS[operation];
    }
    default:
      return DEFAULTS[operation];
  }
}
