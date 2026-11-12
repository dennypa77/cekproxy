import "server-only";
import { db, type Customer, type Invoice, type InvoiceProduk, type WebshareAccount } from "../db";
import { notifyInvoice, notifyKedaluwarsa, type InvoiceRingkas, type PeristiwaDiscord } from "../discord";
import { METODE_LABEL, type MetodeBayar } from "../payment";
import { INVOICE_AKTIF } from "../invoice-status";
import { proxyKind } from "../plan-type";
import { findItem, findPaket, MASA_AKTIF_HARI, PAKET_ROTATING, SEMUA_PAKET } from "../pricing";

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
  produk: InvoiceProduk;
  paket_sku: string;
  paket_nama: string;
  kategori: string;
  ip: number;
  bandwidth_gb: number;
  masa_aktif_hari: number;
  harga_rp: number;
  rate_per_minute: number | null;
}

/**
 * Ambil data paket dari katalog server.
 *
 * Harga TIDAK PERNAH datang dari form: form hanya mengirim SKU, sisanya
 * dibaca ulang di sini supaya nominal tidak bisa dikarang dari browser.
 */
export function paketUntukInvoice(sku: string): PaketUntukInvoice | null {
  const item = findItem(sku);
  if (!item) return null;
  return {
    produk: item.produk,
    paket_sku: item.sku,
    paket_nama: item.nama,
    kategori: item.kategoriId,
    ip: item.ip,
    bandwidth_gb: item.bandwidthGb,
    masa_aktif_hari: item.masaAktifHari,
    harga_rp: item.hargaRp,
    rate_per_minute: item.ratePerMinute,
  };
}

/** Sisa waktu bayar dalam detik (0 kalau sudah lewat). */
export function sisaWaktuBayar(invoice: Invoice, sekarang = Date.now()): number {
  const sisa = new Date(invoice.expires_at).getTime() - sekarang;
  return sisa > 0 ? Math.floor(sisa / 1000) : 0;
}

// ---------------------------------------------------------------------------
// Data siap render untuk halaman customer
// ---------------------------------------------------------------------------

/**
 * Tebak paket mana yang paling mirip dengan pesanan yang sedang berjalan,
 * supaya tombol perpanjang sudah terisi pilihan yang masuk akal.
 *
 * Hanya tebakan untuk nilai awal dropdown — harga tetap dibaca ulang dari
 * katalog di server saat invoice dibuat.
 */
export function tebakSku(account: WebshareAccount | null | undefined): string | null {
  if (!account) return null;
  const kind = proxyKind(account.proxy_subtype);
  const kategori = kind === "residential" ? "residential" : kind === "unknown" ? null : "datacenter";
  const ip = account.proxy_count;
  const gb = account.bandwidth_limit_gb;
  if (!kategori || !ip) return null;

  const kandidat = SEMUA_PAKET.filter((paket) => paket.kategoriId === kategori);
  if (kandidat.length === 0) return null;

  // Jarak relatif, supaya selisih IP dan bandwidth sama-sama dihitung adil.
  const skor = (paket: (typeof kandidat)[number]) =>
    Math.abs(paket.ip - ip) / ip + (gb ? Math.abs(paket.bandwidthGb - gb) / gb : 0);
  return kandidat.reduce((best, paket) => (skor(paket) < skor(best) ? paket : best)).sku;
}

export interface PerpanjangRow {
  orderId: string;
  orderNo: string;
  expiresAt: string;
  /** Pesanan rotating: perpanjangannya memakai paket rotating, bukan paket statis. */
  rotating: boolean;
  skuTebakan: string | null;
  /** Invoice perpanjangan yang masih berjalan untuk pesanan ini. */
  invoiceBerjalan: string | null;
}

/** Pesanan milik customer yang bisa diperpanjang lewat checkout. */
export async function listPerpanjang(customerId: string): Promise<PerpanjangRow[]> {
  const repo = db();
  const [orders, invoices] = await Promise.all([
    repo.listOrdersByCustomer(customerId),
    repo.listInvoicesByCustomer(customerId),
  ]);
  if (orders.length === 0) return [];

  const accounts = await repo.listAccounts();
  const accountById = new Map(accounts.map((a) => [a.id, a]));
  const berjalan = new Map(
    invoices
      .filter((inv) => inv.extend_order_id && INVOICE_AKTIF.includes(inv.status))
      .map((inv) => [inv.extend_order_id as string, inv.invoice_no]),
  );

  // Kalau pesanan ini dulu lahir dari sebuah invoice, SKU-nya sudah pasti —
  // tidak perlu ditebak-tebak dari spesifikasi akun. Ini satu-satunya cara
  // tahu paket rotating mana yang dipakai, karena tabel orders tidak
  // menyimpan kategori pool-nya.
  const skuAsli = new Map(
    invoices
      .filter((inv) => inv.order_id && inv.status === "disetujui")
      .map((inv) => [inv.order_id as string, inv.paket_sku]),
  );

  return orders
    .filter((order) => order.is_active)
    .sort((a, b) => a.expires_at.localeCompare(b.expires_at))
    .map((order) => ({
      orderId: order.id,
      orderNo: order.shopee_order_no,
      expiresAt: order.expires_at,
      rotating: order.order_type === "rotating",
      skuTebakan:
        skuAsli.get(order.id) ??
        (order.order_type === "rotating"
          ? // Pesanan rotating lama (dibuat admin, bukan dari invoice): tidak ada
            // jejak kategorinya, jadi biarkan customer yang memilih sendiri.
            null
          : tebakSku(order.account_id ? accountById.get(order.account_id) : null)),
      invoiceBerjalan: berjalan.get(order.id) ?? null,
    }));
}
