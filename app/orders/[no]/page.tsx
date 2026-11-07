import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NotAvailable } from "@/components/customer/NotAvailable";
import { OrderDashboard } from "@/components/customer/OrderDashboard";
import { RotatingDashboard } from "@/components/customer/RotatingDashboard";
import { devConfigHint } from "@/lib/env";
import { LoginNotice } from "@/components/customer/LoginNotice";
import { formatDate, formatDateTime } from "@/lib/format";
import { getClientIp } from "@/lib/ip";
import { customerPath } from "@/lib/links";
import { normalizeOrderNo, ORDER_NO_PATTERN, safeDecode } from "@/lib/order-no";
import { customerPlanLabel } from "@/lib/plan-type";
import { hitRateLimit, isRateLimited, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { ACCESS_MESSAGES, GRACE_DAYS, resolveCustomerOrder } from "@/lib/services/customer";
import { resolveOrderAccess } from "@/lib/services/order-access";
import { getRotatingPool, poolCountries } from "@/lib/services/rotating";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detail Pesanan",
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: { params: Promise<{ no: string }> }) {
  const raw = safeDecode((await params).no);
  const orderNo = normalizeOrderNo(raw);
  if (orderNo !== raw && ORDER_NO_PATTERN.test(orderNo)) redirect(customerPath(orderNo));

  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
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

  const { order, account, expired, daysLeft } = access.ctx;
  const graceEndsAt = new Date(new Date(order.expires_at).getTime() + GRACE_DAYS * 86_400_000).toISOString();

  // Akun customer: wajib masuk setelah tanggal yang ditetapkan admin.
  const akses = await resolveOrderAccess(order);
  if (akses.gate === "login") redirect(`/akun/masuk?next=${encodeURIComponent(customerPath(order.shopee_order_no))}`);
  if (akses.gate === "claim") redirect(`/akun/klaim?pesanan=${encodeURIComponent(order.shopee_order_no)}`);
  if (akses.gate === "other") {
    return (
      <NotAvailable
        icon="alert"
        title="Pesanan ada di akun lain"
        body="Nomor pesanan ini sudah ditautkan ke akun customer lain. Kalau ini pesanan Anda, hubungi admin lewat WhatsApp."
        orderNo={order.shopee_order_no}
      />
    );
  }

  const backHref = akses.mine ? "/akun" : "/";
  const backLabel = akses.mine ? "Semua pesanan saya" : "Cek pesanan lain";
  const notice = !akses.mine ? <LoginNotice orderNo={order.shopee_order_no} enforceFrom={akses.enforceFrom} /> : null;

  // Pesanan rotating: tampilkan endpoint + kunci API, bukan daftar proxy tetap.
  if (order.order_type === "rotating" && order.api_key) {
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
    const proto = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

    let poolSize = 0;
    let countries: { code: string; count: number }[] = [];
    try {
      const pool = await getRotatingPool();
      poolSize = pool.proxies.length;
      countries = poolCountries(pool);
    } catch (error) {
      console.error("[pesanan] pool rotating gagal dimuat", error);
    }

    return (
      <>
      {notice}
      <RotatingDashboard
        orderNo={order.shopee_order_no}
        namaCustomer={order.nama_customer}
        expiresAtLabel={formatDateTime(order.expires_at)}
        expiresDateShort={formatDate(order.expires_at)}
        graceEndsLabel={formatDate(graceEndsAt)}
        daysLeft={daysLeft}
        expired={expired}
        apiKey={order.api_key}
        baseUrl={`${proto}://${host}`}
        ratePerMinute={order.rate_per_minute}
        poolSize={poolSize}
        countries={countries}
        backHref={backHref}
        backLabel={backLabel}
      />
      </>
    );
  }

  // Customer cukup melihat Datacenter atau Residential (null jika info plan belum tersinkron).
  const jenisProxy = customerPlanLabel(account);

  return (
    <>
    {notice}
    <OrderDashboard
      orderNo={order.shopee_order_no}
      namaCustomer={order.nama_customer}
      expiresAtLabel={formatDateTime(order.expires_at)}
      expiresDateShort={formatDate(order.expires_at)}
      graceEndsLabel={formatDate(graceEndsAt)}
      daysLeft={daysLeft}
      expired={expired}
      jenisProxy={jenisProxy}
      initialReplaceUsed={order.replace_used}
      initialReplaceQuota={order.replace_quota}
      backHref={backHref}
      backLabel={backLabel}
    />
    </>
  );
}
