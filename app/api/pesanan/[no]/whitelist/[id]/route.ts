import { z } from "@/lib/zod";
import { jsonError, jsonOk, loadCustomerRoute } from "@/lib/api-route";
import { customerErrorMessage } from "@/lib/customer-errors";
import { deleteIpAuthorization } from "@/lib/webshare";

export const dynamic = "force-dynamic";

const idSchema = z.coerce.number().int().positive();

export async function DELETE(request: Request, { params }: { params: Promise<{ no: string; id: string }> }) {
  const { no, id } = await params;
  const loaded = await loadCustomerRoute(request, no, { bucket: "whitelist", requireNotExpired: true });
  if (!loaded.ok) return loaded.response;

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return jsonError("Data tidak valid.", 400);

  try {
    await deleteIpAuthorization(loaded.ctx.account.api_key, parsedId.data);
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(customerErrorMessage(error, "whitelist_delete"), 400);
  }
}
