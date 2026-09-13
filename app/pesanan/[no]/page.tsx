import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NotAvailable } from "@/components/customer/NotAvailable";
import { OrderDashboard } from "@/components/customer/OrderDashboard";
import { devConfigHint } from "@/lib/env";
import { formatDate, formatDateTime } from "@/lib/format";
import { getClientIp } from "@/lib/ip";
import { customerPath } from "@/lib/links";
import { normalizeOrderNo, ORDER_NO_PATTERN, safeDecode } from "@/lib/order-no";
import { hitRateLimit, isRateLimited, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { ACCESS_MESSAGES, GRACE_DAYS, resolveCustomerOrder } from "@/lib/services/customer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detail Pesanan",
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: { params: Promise<{ no: string }> }) {
  const raw = safeDecode((await params).no);
  const orderNo = normalizeOrderNo(raw);
  if (orderNo !== raw && ORDER_NO_PATTERN.test(orderNo)) redirect(customerPath(orderNo));

  const ip = getClientIp(await headers());
  if (await isRateLimited("search", ip)) {
    return <NotAvailable icon="slow" title="Terlalu banyak percobaan" body={RATE_LIMIT_MESSAGE} />;
  }

  let access;
  try {
    access = await resolveCustomerOrder(orderNo);
  } catch (error) {
    console.error("[pesanan] gagal membaca pesanan", error);
    return (
      <NotAvailable
        icon="alert"
        title="Terjadi gangguan"
        body={devConfigHint(error) ?? "Server sedang mengalami gangguan. Silakan muat ulang halaman beberapa saat lagi."}
      />
    );
  }

  if (!access.ok) {
    if (access.reason === "not_found") await hitRateLimit("search", ip);
    const message = ACCESS_MESSAGES[access.reason];
    return (
      <NotAvailable
        icon={message.icon}
        title={message.title}
        body={message.body}
        orderNo={access.reason === "not_found" ? undefined : orderNo}
        showShopee={access.reason === "expired_long"}
      />
    );
  }

  const { order, expired, daysLeft } = access.ctx;
  const graceEndsAt = new Date(new Date(order.expires_at).getTime() + GRACE_DAYS * 86_400_000).toISOString();

  return (
    <OrderDashboard
      orderNo={order.shopee_order_no}
      namaCustomer={order.nama_customer}
      expiresAtLabel={formatDateTime(order.expires_at)}
      expiresDateShort={formatDate(order.expires_at)}
      graceEndsLabel={formatDate(graceEndsAt)}
      daysLeft={daysLeft}
      expired={expired}
      initialReplaceUsed={order.replace_used}
      initialReplaceQuota={order.replace_quota}
    />
  );
}
