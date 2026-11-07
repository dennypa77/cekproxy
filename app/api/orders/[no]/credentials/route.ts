import { z } from "@/lib/zod";
import { jsonError, jsonOk, loadCustomerRoute } from "@/lib/api-route";
import { cacheKeys, invalidate } from "@/lib/cache";
import { customerErrorMessage } from "@/lib/customer-errors";
import type { ProxyCredentials } from "@/lib/public-types";
import { PROXY_CREDENTIAL_PATTERN, updateProxyCredentials } from "@/lib/webshare";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const credentialSchema = z
  .string()
  .trim()
  .regex(PROXY_CREDENTIAL_PATTERN, { error: "Gunakan 8–32 karakter huruf/angka tanpa spasi." });

const bodySchema = z
  .object({
    username: credentialSchema.optional(),
    password: credentialSchema.optional(),
  })
  .refine((value) => Boolean(value.username || value.password), {
    error: "Isi username baru, password baru, atau keduanya.",
  });

export async function POST(request: Request, { params }: { params: Promise<{ no: string }> }) {
  const loaded = await loadCustomerRoute(request, (await params).no, {
    bucket: "credentials",
    requireNotExpired: true,
  });
  if (!loaded.ok) return loaded.response;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Data tidak valid.", 400);

  try {
    const config = await updateProxyCredentials(loaded.ctx.account.api_key, parsed.data);
    // Daftar proxy memuat username/password, jadi cache-nya harus dibuang.
    await invalidate(cacheKeys.proxies(loaded.ctx.account.id));
    return jsonOk<ProxyCredentials>({ username: config.username, password: config.password });
  } catch (error) {
    return jsonError(customerErrorMessage(error, "credentials"), 400);
  }
}
