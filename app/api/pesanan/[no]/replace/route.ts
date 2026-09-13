import { z } from "@/lib/zod";
import { jsonError, jsonOk, loadCustomerRoute } from "@/lib/api-route";
import { isIPv4 } from "@/lib/ip";
import type { ReplaceResponse } from "@/lib/public-types";
import { performReplace } from "@/lib/services/replace";

export const dynamic = "force-dynamic";
// Replace async bisa memakan waktu ±30 detik (polling dibatasi 25 detik).
export const maxDuration = 60;

const bodySchema = z.object({
  ip: z.string().trim().refine((value) => isIPv4(value), { error: "IP proxy tidak valid." }),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^(ANY|[A-Z]{2})$/, { error: "Pilihan negara tidak valid." }),
});

export async function POST(request: Request, { params }: { params: Promise<{ no: string }> }) {
  const loaded = await loadCustomerRoute(request, (await params).no, { bucket: "replace", requireNotExpired: true });
  if (!loaded.ok) return loaded.response;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Data tidak valid.", 400);

  try {
    const result = await performReplace(loaded.ctx, parsed.data.ip, parsed.data.country);
    if (result.status === "failed") return jsonError(result.message, result.httpStatus);
    return jsonOk<ReplaceResponse>({
      status: result.status,
      message: result.message,
      replaceUsed: result.order.replace_used,
      replaceQuota: result.order.replace_quota,
    });
  } catch (error) {
    console.error("[api:replace]", error);
    return jsonError("Replace IP gagal diproses. Silakan coba lagi beberapa saat lagi.", 500);
  }
}
