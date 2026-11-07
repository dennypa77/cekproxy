import "server-only";
import { getDiscordMentionId, getDiscordWebhookUrl } from "./env";
import { siteUrl } from "./site";

/**
 * Notifikasi ke Discord lewat webhook.
 *
 * Tidak pernah melempar error: kegagalan kirim hanya dicatat di log supaya
 * transaksi customer tidak ikut gagal. Mati total kalau DISCORD_WEBHOOK_URL
 * kosong, jadi mode test & lokal tidak pernah mengirim apa pun.
 */
const TIMEOUT_MS = 5_000;

export interface InvoiceRingkas {
  id: string;
  invoice_no: string;
  paket_nama: string;
  total_rp: number;
  metode: string;
  jenis: string;
  catatan_customer?: string | null;
  customerNama: string;
  customerWa: string;
}

export type PeristiwaDiscord = "invoice_baru" | "invoice_dibayar" | "invoice_kedaluwarsa";

const WARNA: Record<PeristiwaDiscord, number> = {
  invoice_baru: 0x2e95ff,
  invoice_dibayar: 0xffc53d,
  invoice_kedaluwarsa: 0x5b6270,
};

const JUDUL: Record<PeristiwaDiscord, string> = {
  invoice_baru: "Invoice baru dibuat",
  invoice_dibayar: "Customer menyatakan SUDAH BAYAR",
  invoice_kedaluwarsa: "Invoice kedaluwarsa",
};

function rupiah(nilai: number): string {
  return `Rp${new Intl.NumberFormat("id-ID").format(nilai)}`;
}

async function kirim(payload: unknown): Promise<void> {
  const url = getDiscordWebhookUrl();
  if (!url) return;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("[discord] gagal kirim", response.status, (await response.text()).slice(0, 200));
    }
  } catch (error) {
    console.error("[discord] gagal kirim", error);
  }
}

/** Notifikasi satu invoice. `mention` dipakai untuk peristiwa yang butuh tindakan. */
export async function notifyInvoice(peristiwa: PeristiwaDiscord, invoice: InvoiceRingkas): Promise<void> {
  const mentionId = getDiscordMentionId();
  const mention = peristiwa !== "invoice_kedaluwarsa" && mentionId ? `<@${mentionId}>` : "";

  await kirim({
    content: mention || undefined,
    allowed_mentions: mentionId ? { parse: [], users: [mentionId] } : { parse: [] },
    embeds: [
      {
        title: `${invoice.invoice_no} · ${JUDUL[peristiwa]}`,
        url: `${siteUrl()}/admin/invoice/${invoice.id}`,
        color: WARNA[peristiwa],
        fields: [
          { name: "Customer", value: `${invoice.customerNama}\n${invoice.customerWa}`, inline: true },
          { name: "Paket", value: `${invoice.paket_nama}${invoice.jenis === "perpanjangan" ? " (perpanjangan)" : ""}`, inline: true },
          { name: "Nominal", value: `\`${rupiah(invoice.total_rp)}\``, inline: true },
          { name: "Metode", value: invoice.metode.toUpperCase(), inline: true },
          ...(invoice.catatan_customer
            ? [{ name: "Catatan customer", value: invoice.catatan_customer.slice(0, 300), inline: false }]
            : []),
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

/** Satu pesan ringkas untuk beberapa invoice yang kedaluwarsa sekaligus. */
export async function notifyKedaluwarsa(nomor: string[]): Promise<void> {
  if (nomor.length === 0) return;
  await kirim({
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: `${nomor.length} invoice kedaluwarsa`,
        description: nomor.slice(0, 20).join(", "),
        color: WARNA.invoice_kedaluwarsa,
        timestamp: new Date().toISOString(),
      },
    ],
  });
}
