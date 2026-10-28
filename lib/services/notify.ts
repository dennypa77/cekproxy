import "server-only";
import { db, type Order, type WaTemplate } from "../db";
import { daysLeft as computeDaysLeft, formatDate } from "../format";
import { waExpiryMessage } from "../links";
import { siteUrl } from "../site";
import { sendWhatsApp, waSenderEnabled } from "../wa-sender";

/** Berapa hari sebelum expired pesan dikirim, dan nama templatenya. */
const JADWAL: { hari: number; template: WaTemplate }[] = [
  { hari: 3, template: "expiry_h3" },
  { hari: 1, template: "expiry_h1" },
  { hari: 0, template: "expired" },
];

/** Maksimal pesan per eksekusi, supaya satu putaran tidak kelamaan. */
const MAX_PER_RUN = 40;
const JEDA_MS = 1200;

export interface NotifyResult {
  enabled: boolean;
  dryRun: boolean;
  kandidat: number;
  terkirim: number;
  gagal: number;
  dilewati: number;
  detail: string[];
}

function penerima(order: Order, waAkun: string | null): string | null {
  return waAkun ?? order.wa_number;
}

/**
 * Kirim pengingat masa aktif ke customer. Satu pesanan hanya menerima satu
 * pesan per jenis pengingat (dijaga tabel wa_messages).
 */
export async function runExpiryNotifications(options: { dryRun?: boolean } = {}): Promise<NotifyResult> {
  const dryRun = options.dryRun ?? false;
  const result: NotifyResult = {
    enabled: waSenderEnabled(),
    dryRun,
    kandidat: 0,
    terkirim: 0,
    gagal: 0,
    dilewati: 0,
    detail: [],
  };

  const repo = db();
  const [orders, customers] = await Promise.all([repo.listOrders(), repo.listCustomers()]);
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const now = Date.now();
  const base = siteUrl();

  for (const order of orders) {
    if (!order.is_active) continue;

    const sisa = computeDaysLeft(order.expires_at, now);
    const expiredHariIni = new Date(order.expires_at).getTime() <= now;
    const jadwal = JADWAL.find((j) => (j.hari === 0 ? expiredHariIni : !expiredHariIni && sisa === j.hari));
    if (!jadwal) continue;

    // Pesan "expired" hanya untuk yang baru lewat (maksimal 1 hari), bukan arsip lama.
    if (jadwal.hari === 0 && now - new Date(order.expires_at).getTime() > 86_400_000) continue;

    const akun = order.customer_id ? customerById.get(order.customer_id) : undefined;
    const tujuan = penerima(order, akun?.wa_number ?? null);
    if (!tujuan) {
      result.dilewati++;
      continue;
    }

    result.kandidat++;

    if (await repo.waMessageSent(order.id, jadwal.template)) {
      result.dilewati++;
      continue;
    }

    if (result.terkirim >= MAX_PER_RUN) {
      result.detail.push(`Batas ${MAX_PER_RUN} pesan per putaran tercapai, sisanya menyusul besok.`);
      break;
    }

    const teks = waExpiryMessage(order.shopee_order_no, formatDate(order.expires_at), sisa, `${base}/akun`);

    if (dryRun || !result.enabled) {
      result.detail.push(`(uji coba) ${order.shopee_order_no} → ${tujuan} [${jadwal.template}]`);
      continue;
    }

    const kirim = await sendWhatsApp(tujuan, teks);
    try {
      await repo.insertWaMessage({
        order_id: order.id,
        customer_id: order.customer_id,
        to_number: tujuan,
        template: jadwal.template,
        status: kirim.ok ? "sent" : "failed",
        error: kirim.ok ? null : kirim.error,
        provider_id: kirim.ok ? kirim.providerId : null,
      });
    } catch (error) {
      console.error("[notify] gagal mencatat pesan", error);
    }

    if (kirim.ok) {
      result.terkirim++;
      result.detail.push(`${order.shopee_order_no} → ${tujuan} [${jadwal.template}]`);
    } else {
      result.gagal++;
      result.detail.push(`GAGAL ${order.shopee_order_no}: ${kirim.error}`);
    }

    await new Promise((resolve) => setTimeout(resolve, JEDA_MS));
  }

  return result;
}
