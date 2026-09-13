import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminPassword, getSessionSecret, isProduction } from "./env";

const COOKIE_NAME = "dm_admin_session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

/** Kunci HMAC ikut berubah jika ADMIN_PASSWORD diganti → semua sesi lama batal. */
function signingKey(): string {
  const passwordHash = createHash("sha256").update(getAdminPassword() ?? "").digest("hex");
  return `${getSessionSecret()}:${passwordHash}`;
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkAdminPassword(input: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;
  return safeEqual(input, expected);
}

export async function createAdminSession(): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ role: "admin", exp })).toString("base64url");
  const store = await cookies();
  store.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroyAdminSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

function verifyToken(token: string | undefined): boolean {
  if (!token || !getAdminPassword()) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { role?: string; exp?: number };
    return data.role === "admin" && typeof data.exp === "number" && data.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  return verifyToken((await cookies()).get(COOKIE_NAME)?.value);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
