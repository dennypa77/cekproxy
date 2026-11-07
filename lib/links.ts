/** No marketplace service fee when you order directly. */
export const BEBAS_BIAYA_ADMIN = "No service fee";
export const WHATSAPP_NUMBER = "62895325425299";

export function whatsappLink(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function waExtendLink(orderNo: string, expiresLabel: string): string {
  return whatsappLink(
    `Hi dmproxy, I'd like to renew my proxy.\n\nOrder number: ${orderNo}\nExpires: ${expiresLabel}\n\nPlease let me know how to pay. Thank you.`,
  );
}

/** Order a new package directly via WhatsApp. */
export function waOrderLink(paket: { kategori: string; ip: number; bandwidthGb: number; harga: string }): string {
  return whatsappLink(
    `Hi dmproxy, I'd like to place an order.\n\nPackage: ${paket.kategori} ${paket.ip} IP / ${paket.bandwidthGb} GB\nPrice: ${paket.harga}\n\nPlease let me know how to pay. Thank you.`,
  );
}

/** Ask about packages without naming a specific one. */
export function waOrderGeneralLink(): string {
  return whatsappLink(
    "Hi dmproxy, I'd like to order a proxy. Could you help me pick a package? Thank you.",
  );
}

export function waQuotaLink(orderNo: string): string {
  return whatsappLink(
    `Hi dmproxy, the IP replace quota for order ${orderNo} has run out. Could you help?`,
  );
}

export function waHelpLink(orderNo?: string): string {
  return whatsappLink(
    orderNo
      ? `Hi dmproxy, I need help with proxy order ${orderNo}.`
      : "Hi dmproxy, I need help with my proxy order.",
  );
}

export function customerPath(orderNo: string): string {
  return `/orders/${encodeURIComponent(orderNo)}`;
}

/** Chat ke nomor customer (nomor kanonik 62…, lihat lib/wa-number.ts). */
export function waTo(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function waClaimCodeMessage(orderNo: string, code: string, dashboardUrl: string): string {
  return [
    "Hi! Your proxy order is ready.",
    "",
    `Order number: ${orderNo}`,
    `Claim code: ${code}`,
    "",
    `Open ${dashboardUrl}, sign up / log in with this WhatsApp number, then enter the code above to see your order.`,
    "",
    "Thank you — dmproxy",
  ].join("\n");
}

export function waExpiryMessage(orderNo: string, expiresLabel: string, daysLeft: number, dashboardUrl: string): string {
  const kapan = daysLeft <= 0 ? "today" : `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
  return [
    `Hi! Your proxy (${orderNo}) will expire ${kapan}, on ${expiresLabel}.`,
    "",
    "Reply to this chat if you'd like to renew — same price, no service fee.",
    `See the details at ${dashboardUrl}`,
    "",
    "Reply STOP if you no longer want these reminders.",
  ].join("\n");
}
