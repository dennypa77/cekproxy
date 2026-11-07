import "server-only";
import { db, type Customer, type Invoice } from "../db";
import { notifyInvoice, notifyKedaluwarsa, type InvoiceRingkas, type PeristiwaDiscord } from "../discord";
import { METODE_LABEL, type MetodeBayar } from "../payment";
import { findPaket, MASA_AKTIF_HARI } from "../pricing";

/** Invoice yang belum dibayar hangus setelah ini. */
export const INVOICE_TTL_JAM = 24;
/** Maksimal invoice yang masih menunggu per customer. */
export const MAKS_INVOICE_AKTIF = 3;

const KUNCI_SAPU = "sweep:invoice";
const KUNCI_NOTIF_KEDALUWARSA = "discord:kedaluwarsa";

/**
 * Tandai invoice yang lewat tempo sebagai kedaluwarsa.
 *
 * Dipanggil sambil lalu dari halaman yang menampilkan invoice (tidak ada cron),
 * dengan kunci di cache supaya paling sering sekali per menit.
 */
export async function sapuInvoiceKedaluwarsa(): Promise<void> {
  const repo = db();
  try {
    if (await repo.cacheGet<boolean>(KUNCI_SAPU)) return;
    await repo.cacheSet(KUNCI_SAPU, true, 60);

    const kena = await repo.expireDueInvoices();
    if (kena.length === 0) return;

    // Beritahu sekali per jam saja — ini informasi, bukan hal mendesak.
    if (!(await repo.cacheGet<boolean>(KUNCI_NOTIF_KEDALUWARSA))) {
      await repo.cacheSet(KUNCI_NOTIF_KEDALUWARSA, true, 3600);
      await notifyKedaluwarsa(kena);
    }
  } catch (error) {
    console.error("[invoice] sapu kedaluwarsa gagal", error);
  }
}

/** Data ringkas untuk pesan Discord. */
export function ringkasUntukDiscord(invoice: Invoice, customer: Customer | null): InvoiceRingkas {
  return {
    id: invoice.id,
    invoice_no: invoice.invoice_no,
    paket_nama: invoice.paket_nama,
    total_rp: invoice.total_rp,
    metode: METODE_LABEL[invoice.metode as MetodeBayar] ?? invoice.metode,
    jenis: invoice.jenis,
    catatan_customer: invoice.catatan_customer,
    customerNama: customer?.nama ?? "(tidak diketahui)",
    customerWa: customer?.wa_number ?? "-",
  };
}

/** Kirim notifikasi tanpa pernah menggagalkan transaksi pemanggil. */
export async function kabariDiscord(
  peristiwa: PeristiwaDiscord,
  invoice: Invoice,
  customer: Customer | null,
): Promise<void> {
  try {
    await notifyInvoice(peristiwa, ringkasUntukDiscord(invoice, customer));
  } catch (error) {
    console.error("[invoice] notifikasi discord gagal", error);
  }
}

export interface PaketUntukInvoice {
  paket_sku: string;
  paket_nama: string;
  kategori: string;
  ip: number;
  bandwidth_gb: number;
  masa_aktif_hari: number;
  harga_rp: number;
}

/**
 * Ambil data paket dari katalog server.
 *
 * Harga TIDAK PERNAH datang dari form: form hanya mengirim SKU, sisanya
 * dibaca ulang di sini supaya nominal tidak bisa dikarang dari browser.
 */
export function paketUntukInvoice(sku: string): PaketUntukInvoice | null {
  const paket = findPaket(sku);
  if (!paket) return null;
  return {
    paket_sku: paket.sku,
    paket_nama: `${paket.kategoriNama} ${paket.ip} IP · ${paket.bandwidthGb} GB`,
    kategori: paket.kategoriId,
    ip: paket.ip,
    bandwidth_gb: paket.bandwidthGb,
    masa_aktif_hari: MASA_AKTIF_HARI,
    harga_rp: paket.hargaRp,
  };
}

/** Sisa waktu bayar dalam detik (0 kalau sudah lewat). */
export function sisaWaktuBayar(invoice: Invoice, sekarang = Date.now()): number {
  const sisa = new Date(invoice.expires_at).getTime() - sekarang;
  return sisa > 0 ? Math.floor(sisa / 1000) : 0;
}
