import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, type Customer } from "./db";
import { getSessionSecret, isProduction } from "./env";

const COOKIE_NAME = "dm_customer_session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Sesi customer sengaja memakai namespace kunci sendiri — bukan hash
 * ADMIN_PASSWORD seperti sesi admin — supaya ganti password admin tidak
 * mengeluarkan semua customer, dan token admin/customer tidak pernah
 * saling berlaku.
 */
function signingKey(): string {
  return `${getSessionSecret()}:customer`;
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function createCustomerSession(customer: Customer): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(
    JSON.stringify({ sub: customer.id, v: customer.session_version, exp }),
  ).toString("base64url");

  const store = await cookies();
  store.delete(COOKIE_NAME);
  store.set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroyCustomerSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

function readToken(token: string | undefined): { sub: string; v: number } | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: string;
      v?: number;
      exp?: number;
    };
    if (typeof data.sub !== "string" || typeof data.v !== "number") return null;
    if (typeof data.exp !== "number" || data.exp <= Date.now() / 1000) return null;
    return { sub: data.sub, v: data.v };
  } catch {
    return null;
  }
}

/**
 * Customer yang sedang masuk, atau null. Dibungkus cache() supaya beberapa
 * komponen dalam satu request hanya memicu satu query.
 */
export const getCustomer = cache(async (): Promise<Customer | null> => {
  const claims = readToken((await cookies()).get(COOKIE_NAME)?.value);
  if (!claims) return null;

  let customer: Customer | null = null;
  try {
    customer = await db().getCustomer(claims.sub);
  } catch (error) {
    console.error("[akun] gagal membaca customer", error);
    return null;
  }

  if (!customer || customer.is_blocked) return null;
  // Password diganti / akun diblokir-dibuka lagi → sesi lama tidak berlaku.
  if (customer.session_version !== claims.v) return null;
  return customer;
});

export async function requireCustomer(next?: string): Promise<Customer> {
  const customer = await getCustomer();
  if (!customer) redirect(next ? `/akun/masuk?next=${encodeURIComponent(next)}` : "/akun/masuk");
  return customer;
}
