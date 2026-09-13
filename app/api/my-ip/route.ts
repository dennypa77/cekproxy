import { jsonOk } from "@/lib/api-route";
import { getClientIp, isIPv4 } from "@/lib/ip";
import type { MyIpResponse } from "@/lib/public-types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ip = getClientIp(request.headers);
  const known = ip !== "unknown";
  return jsonOk<MyIpResponse>({ ip: known ? ip : null, isIPv4: known && isIPv4(ip) });
}
