export const SHOPEE_STORE_URL = "https://shopee.co.id/dmdigital2";
/** Pesan langsung ke admin: harga sama, tanpa biaya admin marketplace. */
export const BEBAS_BIAYA_ADMIN = "Bebas biaya admin";
export const WHATSAPP_NUMBER = "62895325425299";

export function whatsappLink(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function waExtendLink(orderNo: string, expiresLabel: string): string {
  return whatsappLink(
    `Halo dmproxy, saya ingin perpanjang proxy (pesan langsung).\n\nNomor pesanan: ${orderNo}\nExpired: ${expiresLabel}\n\nMohon info cara bayarnya. Terima kasih.`,
  );
}

/** Pesan paket baru langsung ke admin lewat WhatsApp. */
export function waOrderLink(paket: { kategori: string; ip: number; bandwidthGb: number; harga: string }): string {
  return whatsappLink(
    `Halo dmproxy, saya mau pesan langsung.\n\nPaket: ${paket.kategori} ${paket.ip} IP / ${paket.bandwidthGb} GB\nHarga: ${paket.harga}\n\nMohon info cara bayarnya. Terima kasih.`,
  );
}

/** Tanya paket tanpa menyebut paket tertentu. */
export function waOrderGeneralLink(): string {
  return whatsappLink(
    "Halo dmproxy, saya mau pesan proxy langsung. Mohon dibantu pilihan paketnya. Terima kasih.",
  );
}

export function waQuotaLink(orderNo: string): string {
  return whatsappLink(
    `Halo dmproxy, kuota replace IP untuk pesanan ${orderNo} sudah habis. Mohon bantuannya.`,
  );
}

export function waHelpLink(orderNo?: string): string {
  return whatsappLink(
    orderNo
      ? `Halo dmproxy, saya butuh bantuan untuk pesanan proxy ${orderNo}.`
      : "Halo dmproxy, saya butuh bantuan terkait pesanan proxy saya.",
  );
}

export function customerPath(orderNo: string): string {
  return `/pesanan/${encodeURIComponent(orderNo)}`;
}
