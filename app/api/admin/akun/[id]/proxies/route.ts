import { jsonError, jsonOk } from "@/lib/api-route";
import { db } from "@/lib/db";
import type { PublicProxy } from "@/lib/public-types";
import { getProxies } from "@/lib/services/proxy-data";
import { isAdmin } from "@/lib/session";
import { WebshareError } from "@/lib/webshare";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Daftar proxy satu akun untuk panel admin (API key tidak pernah ikut dikirim). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return jsonError("Tidak diizinkan.", 401);

  const account = await db().getAccount((await params).id);
  if (!account) return jsonError("Akun tidak ditemukan.", 404);

  const fresh = new URL(request.url).searchParams.get("fresh") === "1";
  try {
    const proxies = await getProxies(account, { fresh });
    return jsonOk<PublicProxy[]>(
      proxies.map((p) => ({
        ip: p.proxy_address,
        port: p.port,
        username: p.username,
        password: p.password,
        country: p.country_code,
        valid: p.valid,
      })),
    );
  } catch (error) {
    // Admin boleh melihat alasan teknisnya.
    const message = error instanceof WebshareError ? `${error.kind}: ${error.message}` : String(error);
    return jsonError(message, 502);
  }
}
