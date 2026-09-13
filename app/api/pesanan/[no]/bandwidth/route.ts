import { jsonOk, loadCustomerRoute } from "@/lib/api-route";
import type { BandwidthResponse } from "@/lib/public-types";
import { BANDWIDTH_UNAVAILABLE, getBandwidth, toBandwidthResponse } from "@/lib/services/proxy-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ no: string }> }) {
  const loaded = await loadCustomerRoute(request, (await params).no);
  if (!loaded.ok) return loaded.response;

  const refresh = new URL(request.url).searchParams.get("refresh") === "1";
  try {
    const { usage, cachedAt } = await getBandwidth(loaded.ctx.account, { refresh });
    return jsonOk<BandwidthResponse>(toBandwidthResponse(usage, cachedAt));
  } catch (error) {
    console.error("[api:bandwidth]", error);
    return jsonOk<BandwidthResponse>({ available: false, message: BANDWIDTH_UNAVAILABLE });
  }
}
