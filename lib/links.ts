export const SHOPEE_STORE_URL = "https://shopee.co.id/dmdigital2";
export const WHATSAPP_NUMBER = "62895325425299";

export function whatsappLink(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function waExtendLink(orderNo: string, expiresLabel: string): string {
  return whatsappLink(
    `Halo DM Digital, saya ingin memperpanjang proxy.\n\nNomor pesanan: ${orderNo}\nExpired: ${expiresLabel}\n\nTerima kasih.`,
  );
}

export function waQuotaLink(orderNo: string): string {
  return whatsappLink(
    `Halo DM Digital, kuota replace IP untuk pesanan ${orderNo} sudah habis. Mohon bantuannya.`,
  );
}

export function waHelpLink(orderNo?: string): string {
  return whatsappLink(
    orderNo
      ? `Halo DM Digital, saya butuh bantuan untuk pesanan proxy ${orderNo}.`
      : "Halo DM Digital, saya butuh bantuan terkait pesanan proxy saya.",
  );
}

export function customerPath(orderNo: string): string {
  return `/pesanan/${encodeURIComponent(orderNo)}`;
}
