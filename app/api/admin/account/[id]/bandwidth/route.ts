import { jsonError, jsonOk } from "@/lib/api-route";
import { db } from "@/lib/db";
import type { BandwidthResponse } from "@/lib/public-types";
import { getBandwidth, toBandwidthResponse } from "@/lib/services/proxy-data";
import { isAdmin } from "@/lib/session";
import { WebshareError } from "@/lib/webshare";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return jsonError("Tidak diizinkan.", 401);

  const account = await db().getAccount((await params).id);
  if (!account) return jsonError("Akun tidak ditemukan.", 404);

  try {
    const { usage, cachedAt } = await getBandwidth(account);
    return jsonOk<BandwidthResponse>(toBandwidthResponse(usage, cachedAt));
  } catch (error) {
    // Admin boleh melihat alasan teknis.
    const message = error instanceof WebshareError ? `${error.kind}: ${error.message}` : String(error);
    return jsonOk<BandwidthResponse>({ available: false, message });
  }
}
