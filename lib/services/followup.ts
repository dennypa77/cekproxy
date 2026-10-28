import "server-only";
import { db, type Order, type WaTemplate } from "../db";
import { daysLeft as computeDaysLeft, DAY_MS, formatDate } from "../format";
import { waClaimCodeMessage, waExpiryMessage } from "../links";
import { siteUrl } from "../site";

/**
 * Daftar follow-up untuk dikerjakan admin secara manual lewat WhatsApp.
 * Tidak ada pengiriman otomatis: tombol di panel hanya membuka WhatsApp
 * dengan pesan yang sudah terisi, dari nomor admin sendiri.
 */
export type FollowUpJenis = "akan_expired" | "expired" | "belum_klaim";

export interface FollowUpRow {
  orderId: string;
  orderNo: string;
  jenis: FollowUpJenis;
  template: WaTemplate;
  /** Label singkat untuk ditampilkan di tabel. */
  alasan: string;
  namaCustomer: string | null;
  /** Nomor tujuan (akun customer, atau nomor yang dicatat di pesanan). */
  waNumber: string | null;
  punyaAkun: boolean;
  expiresLabel: string;
  daysLeft: number;
  pesan: string;
  /** Sudah ditandai terkirim untuk jenis pesan yang sama. */
  sudahDihubungi: boolean;
}

/** Berapa hari sebelum expired customer mulai diingatkan. */
const INGATKAN_HARI = 3;
/** Berapa lama pesanan yang sudah lewat tetap muncul di daftar. */
const TAMPIL_SETELAH_EXPIRED_HARI = 7;

function templateUntuk(jenis: FollowUpJenis, daysLeft: number): WaTemplate {
  if (jenis === "belum_klaim") return "claim_code";
  if (jenis === "expired") return "expired";
  return daysLeft <= 1 ? "expiry_h1" : "expiry_h3";
}

export async function listFollowUps(): Promise<FollowUpRow[]> {
  const repo = db();
  const [orders, customers, messages] = await Promise.all([
    repo.listOrders(),
    repo.listCustomers(),
    repo.listWaMessages(500),
  ]);

  const customerById = new Map(customers.map((c) => [c.id, c]));
  const sudah = new Set(
    messages.filter((m) => m.status === "sent" && m.order_id).map((m) => `${m.order_id}:${m.template}`),
  );
  const now = Date.now();
  const base = siteUrl();

  const rows: FollowUpRow[] = [];

  const tambah = (order: Order, jenis: FollowUpJenis) => {
    const pemilik = order.customer_id ? customerById.get(order.customer_id) : undefined;
    const waNumber = pemilik?.wa_number ?? order.wa_number;
    const sisa = computeDaysLeft(order.expires_at, now);
    const template = templateUntuk(jenis, sisa);
    const expiresLabel = formatDate(order.expires_at);

    rows.push({
      orderId: order.id,
      orderNo: order.shopee_order_no,
      jenis,
      template,
      alasan:
        jenis === "belum_klaim"
          ? "Kode klaim belum dipakai"
          : jenis === "expired"
            ? `Expired ${expiresLabel}`
            : sisa <= 1
              ? "Expired besok / hari ini"
              : `${sisa} hari lagi`,
      namaCustomer: pemilik?.nama ?? order.nama_customer,
      waNumber,
      punyaAkun: Boolean(pemilik),
      expiresLabel,
      daysLeft: sisa,
      pesan:
        jenis === "belum_klaim"
          ? waClaimCodeMessage(order.shopee_order_no, order.claim_code ?? "", `${base}/akun/daftar`)
          : waExpiryMessage(order.shopee_order_no, expiresLabel, sisa, `${base}/akun`),
      sudahDihubungi: sudah.has(`${order.id}:${template}`),
    });
  };

  for (const order of orders) {
    if (!order.is_active) continue;

    const expiresAt = new Date(order.expires_at).getTime();
    const sudahLewat = expiresAt <= now;

    if (!sudahLewat && expiresAt - now <= INGATKAN_HARI * DAY_MS) {
      tambah(order, "akan_expired");
      continue;
    }
    if (sudahLewat && now - expiresAt <= TAMPIL_SETELAH_EXPIRED_HARI * DAY_MS) {
      tambah(order, "expired");
      continue;
    }
    // Pesanan masih lama tapi kode klaimnya belum dipakai → ingatkan sekali.
    if (!sudahLewat && order.claim_code && !order.customer_id) {
      tambah(order, "belum_klaim");
    }
  }

  // Yang paling mendesak di atas: expired dulu, lalu paling dekat expired.
  const urutan: Record<FollowUpJenis, number> = { expired: 0, akan_expired: 1, belum_klaim: 2 };
  return rows.sort((a, b) => urutan[a.jenis] - urutan[b.jenis] || a.daysLeft - b.daysLeft);
}
