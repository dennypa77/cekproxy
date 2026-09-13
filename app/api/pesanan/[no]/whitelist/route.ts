import { z } from "@/lib/zod";
import { jsonError, jsonOk, loadCustomerRoute } from "@/lib/api-route";
import { customerErrorMessage } from "@/lib/customer-errors";
import { publicIpv4Schema } from "@/lib/ip";
import type { WhitelistEntry } from "@/lib/public-types";
import { addIpAuthorization, listIpAuthorizations } from "@/lib/webshare";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ no: string }> }) {
  const loaded = await loadCustomerRoute(request, (await params).no);
  if (!loaded.ok) return loaded.response;

  try {
    const entries = await listIpAuthorizations(loaded.ctx.account.api_key);
    return jsonOk<WhitelistEntry[]>(
      entries.map((e) => ({ id: e.id, ip: e.ip_address, createdAt: e.created_at, lastUsedAt: e.last_used_at })),
    );
  } catch (error) {
    return jsonError(customerErrorMessage(error, "whitelist_list"), 502);
  }
}

const bodySchema = z.object({ ip: publicIpv4Schema });

export async function POST(request: Request, { params }: { params: Promise<{ no: string }> }) {
  const loaded = await loadCustomerRoute(request, (await params).no, { bucket: "whitelist", requireNotExpired: true });
  if (!loaded.ok) return loaded.response;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "IP tidak valid.", 400);

  try {
    const entry = await addIpAuthorization(loaded.ctx.account.api_key, parsed.data.ip);
    return jsonOk<WhitelistEntry>(
      { id: entry.id, ip: entry.ip_address, createdAt: entry.created_at, lastUsedAt: entry.last_used_at },
      201,
    );
  } catch (error) {
    return jsonError(customerErrorMessage(error, "whitelist_add"), 400);
  }
}
