import { jsonError, jsonOk, loadCustomerRoute } from "@/lib/api-route";
import { customerErrorMessage } from "@/lib/customer-errors";
import { db } from "@/lib/db";
import type { ProxiesResponse } from "@/lib/public-types";
import { getProxies } from "@/lib/services/proxy-data";
import { reconcilePendingReplaces } from "@/lib/services/replace";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request, { params }: { params: Promise<{ no: string }> }) {
  const loaded = await loadCustomerRoute(request, (await params).no);
  if (!loaded.ok) return loaded.response;
  const { order, account, expired } = loaded.ctx;

  let pending = 0;
  try {
    pending = await reconcilePendingReplaces(order, account);
  } catch (error) {
    console.error("[api:proxies] rekonsiliasi replace gagal", error);
  }

  try {
    const fresh = new URL(request.url).searchParams.get("fresh") === "1";
    const proxies = await getProxies(account, { fresh });
    const latest = (await db().getOrder(order.id)) ?? order;

    return jsonOk<ProxiesResponse>({
      proxies: proxies.map((p) => ({
        ip: p.proxy_address,
        port: p.port,
        username: p.username,
        // Pesanan expired: daftar tetap tampil (diburamkan) tanpa password asli.
        password: expired ? "••••••••" : p.password,
        country: p.country_code,
        valid: p.valid,
      })),
      replaceUsed: latest.replace_used,
      replaceQuota: latest.replace_quota,
      pendingReplace: pending > 0,
      masked: expired,
    });
  } catch (error) {
    return jsonError(customerErrorMessage(error, "proxies"), 502);
  }
}
