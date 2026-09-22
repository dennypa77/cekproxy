import "server-only";
import { z } from "zod";
import { isTestMode } from "./env";
import { mockTransport } from "./webshare-mock";
import { randomInt } from "node:crypto";
import {
  WebshareError,
  type IpAuthorization,
  type PlanInfo,
  type ProxyConfigInfo,
  type ProxyCredentialPatch,
  type ProxyItem,
  type ReplacementJob,
  type ReplaceTarget,
  type SubscriptionInfo,
  type WebshareTransport,
} from "./webshare-types";

/*
 * Klien API Webshare. Referensi: https://apidocs.webshare.io
 * - Header: Authorization: Token <API_KEY>
 * - Semua path WAJIB diakhiri "/"
 * - API key diterima per pemanggilan (1 pesanan = 1 akun)
 * - WEBSHARE_TEST_MODE=true → memakai data mock (lib/webshare-mock.ts)
 */

export const WEBSHARE_BASE_URL = "https://proxy.webshare.io";

/**
 * `bandwidth_total` dari /api/v2/stats/aggregate/ dalam bytes (docs: "Total bandwidth use in bytes"),
 * sedangkan `bandwidth_limit` plan dalam GB. Dikonversi memakai GB desimal (10^9 bytes).
 */
export const BYTES_PER_GB = 1_000_000_000;

const DAY_MS = 86_400_000;
const MAX_PAGES = 200;

type Query = Record<string, string | number | undefined>;

async function request<T = unknown>(
  apiKey: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  options: { query?: Query; body?: unknown; timeoutMs?: number } = {},
): Promise<T> {
  if (!path.startsWith("/api/") || !path.endsWith("/")) {
    throw new Error(`Path Webshare tidak valid (wajib diawali /api/ dan diakhiri /): ${path}`);
  }
  const url = new URL(path, WEBSHARE_BASE_URL);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Token ${apiKey}`,
        Accept: "application/json",
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      throw new WebshareError("timeout", `Timeout ${method} ${path}`);
    }
    throw new WebshareError("network", `Network error ${method} ${path}: ${(error as Error)?.message}`);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const status = response.status;
    const kind =
      status === 401 || status === 403
        ? "auth"
        : status === 404
          ? "not_found"
          : status === 429
            ? "rate_limited"
            : status >= 500
              ? "upstream"
              : "bad_request";
    throw new WebshareError(kind, `${method} ${path} → HTTP ${status}: ${extractMessage(data)}`, status, data);
  }

  return data as T;
}

function extractMessage(data: unknown): string {
  if (typeof data === "string") return data.slice(0, 300);
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    for (const value of Object.values(record)) {
      if (typeof value === "string") return value;
      if (Array.isArray(value) && value.length > 0) {
        const first = value[0];
        if (typeof first === "string") return first;
        if (first && typeof first === "object" && typeof (first as { detail?: unknown }).detail === "string") {
          return (first as { detail: string }).detail;
        }
      }
    }
    return JSON.stringify(data).slice(0, 300);
  }
  return "tanpa pesan";
}

/** Respons bisa berupa object tunggal, array, atau {results:[...]}. */
function toList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const results = (data as { results?: unknown }).results;
    return Array.isArray(results) ? results : [data];
  }
  return [];
}

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, what: string): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new WebshareError("invalid_response", `Format respons ${what} tidak dikenali: ${parsed.error.message}`);
  }
  return parsed.data;
}

/** Ikuti field `next` (hanya jika masih di host Webshare) untuk mengambil semua halaman. */
async function fetchAllPages<T>(
  apiKey: string,
  path: string,
  query: Query,
  itemSchema: z.ZodType<T>,
  what: string,
): Promise<T[]> {
  const pageSchema = z.object({ next: z.string().nullish(), results: z.array(z.unknown()) });
  const items: T[] = [];
  let currentPath = path;
  let currentQuery: Query = query;

  for (let page = 0; page < MAX_PAGES; page++) {
    const data = parseOrThrow(pageSchema, await request(apiKey, "GET", currentPath, { query: currentQuery }), what);
    for (const raw of data.results) items.push(parseOrThrow(itemSchema, raw, what));
    if (!data.next) return items;

    const nextUrl = new URL(data.next, WEBSHARE_BASE_URL);
    if (nextUrl.origin !== WEBSHARE_BASE_URL) {
      throw new WebshareError("invalid_response", `URL next tidak dikenal: ${nextUrl.origin}`);
    }
    currentPath = nextUrl.pathname.endsWith("/") ? nextUrl.pathname : `${nextUrl.pathname}/`;
    currentQuery = Object.fromEntries(nextUrl.searchParams.entries());
  }
  throw new WebshareError("invalid_response", `${what}: jumlah halaman melebihi batas ${MAX_PAGES}`);
}

// ---------------------------------------------------------------------------
// Skema respons (hanya field yang dipakai)
// ---------------------------------------------------------------------------

const planSchema = z.object({
  id: z.number(),
  status: z.string(),
  bandwidth_limit: z.coerce.number(),
  proxy_type: z.string().nullish().transform((v) => v ?? null),
  proxy_subtype: z.string().nullish().transform((v) => v ?? null),
  proxy_count: z.number().nullish().transform((v) => v ?? null),
  proxy_replacements_available: z.number().nullish().transform((v) => v ?? null),
});

const subscriptionSchema = z.object({
  id: z.number(),
  plan: z.number().nullish().transform((v) => v ?? null),
  term: z.string().nullish().transform((v) => v ?? null),
  start_date: z.string(),
  end_date: z.string(),
  throttled: z.boolean().nullish().transform((v) => v ?? null),
});

const proxySchema = z.object({
  proxy_address: z.string(),
  port: z.coerce.number(),
  username: z.string(),
  password: z.string(),
  country_code: z.string().nullish().transform((v) => v ?? null),
  valid: z.boolean(),
});

const ipAuthorizationSchema = z.object({
  id: z.number(),
  ip_address: z.string(),
  created_at: z.string().nullish().transform((v) => v ?? null),
  last_used_at: z.string().nullish().transform((v) => v ?? null),
});

const replacementSchema = z.object({
  id: z.number(),
  state: z.string(),
  error: z.string().nullish().transform((v) => v ?? null),
  error_code: z.string().nullish().transform((v) => v ?? null),
  proxies_removed: z.number().nullish().transform((v) => v ?? null),
  proxies_added: z.number().nullish().transform((v) => v ?? null),
});

const availableCountriesSchema = z.object({ available_countries: z.record(z.string(), z.coerce.number()) });

const proxyConfigSchema = z.object({
  username: z.string(),
  password: z.string(),
  state: z.string().nullish().transform((v) => v ?? null),
});

// ---------------------------------------------------------------------------
// Transport asli
// ---------------------------------------------------------------------------

const realTransport: WebshareTransport = {
  async getPlans(apiKey) {
    const data = await request(apiKey, "GET", "/api/v2/subscription/plan/");
    return toList(data).flatMap((item) => {
      const parsed = planSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    });
  },

  async getSubscriptions(apiKey) {
    const data = await request(apiKey, "GET", "/api/v2/subscription/");
    return toList(data).flatMap((item) => {
      const parsed = subscriptionSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    });
  },

  async getProfileEmail(apiKey) {
    const data = await request(apiKey, "GET", "/api/v2/profile/");
    return parseOrThrow(z.object({ email: z.string().nullish() }), data, "profile").email ?? null;
  },

  async getAggregateBandwidthBytes(apiKey, gteIso, lteIso, planId) {
    const data = await request(apiKey, "GET", "/api/v2/stats/aggregate/", {
      query: { timestamp__gte: gteIso, timestamp__lte: lteIso, plan_id: planId },
    });
    return parseOrThrow(z.object({ bandwidth_total: z.number() }), data, "stats aggregate").bandwidth_total;
  },

  async listAllProxies(apiKey) {
    return fetchAllPages(
      apiKey,
      "/api/v2/proxy/list/",
      { mode: "direct", page: 1, page_size: 100 },
      proxySchema,
      "proxy list",
    );
  },

  async getAvailableCountriesRaw(apiKey) {
    // Endpoint utama: v2 proxy config. Dokumentasi terbaru juga menyediakan
    // available_countries di v3 /proxy/list/stats/ — dipakai jika v2 tidak memuatnya.
    try {
      const parsed = availableCountriesSchema.safeParse(await request(apiKey, "GET", "/api/v2/proxy/config/"));
      if (parsed.success) return parsed.data.available_countries;
      console.warn("[webshare] v2 proxy config tanpa available_countries, mencoba v3 list stats");
    } catch (error) {
      if (!(error instanceof WebshareError) || !["not_found", "invalid_response"].includes(error.kind)) throw error;
      console.warn("[webshare] v2 proxy config gagal, mencoba v3 list stats", error.message);
    }
    const data = await request(apiKey, "GET", "/api/v3/proxy/list/stats/");
    return parseOrThrow(availableCountriesSchema, data, "proxy list stats").available_countries;
  },

  async createReplacement(apiKey, ip, target) {
    const replaceWith =
      target.type === "any"
        ? [{ type: "any", count: 1 }]
        : [{ type: "country", country_code: target.country_code, count: 1 }];
    const data = await request(apiKey, "POST", "/api/v3/proxy/replace/", {
      body: { to_replace: { type: "ip_address", ip_addresses: [ip] }, replace_with: replaceWith, dry_run: false },
    });
    return parseOrThrow(replacementSchema, data, "proxy replacement");
  },

  async getReplacement(apiKey, id) {
    if (!Number.isInteger(id) || id <= 0) throw new WebshareError("bad_request", `ID replacement tidak valid: ${id}`);
    const data = await request(apiKey, "GET", `/api/v3/proxy/replace/${id}/`, { timeoutMs: 8_000 });
    return parseOrThrow(replacementSchema, data, "proxy replacement");
  },

  async listIpAuthorizations(apiKey) {
    return fetchAllPages(apiKey, "/api/v2/proxy/ipauthorization/", {}, ipAuthorizationSchema, "ip authorization");
  },

  async addIpAuthorization(apiKey, ip) {
    const data = await request(apiKey, "POST", "/api/v2/proxy/ipauthorization/", { body: { ip_address: ip } });
    return parseOrThrow(ipAuthorizationSchema, data, "ip authorization");
  },

  async deleteIpAuthorization(apiKey, id) {
    if (!Number.isInteger(id) || id <= 0) throw new WebshareError("bad_request", `ID whitelist tidak valid: ${id}`);
    await request(apiKey, "DELETE", `/api/v2/proxy/ipauthorization/${id}/`);
  },

  async getProxyConfig(apiKey) {
    const data = await request(apiKey, "GET", "/api/v2/proxy/config/");
    return parseOrThrow(proxyConfigSchema, data, "proxy config");
  },

  async updateProxyCredentials(apiKey, patch) {
    const data = await request(apiKey, "PATCH", "/api/v2/proxy/config/", { body: patch, timeoutMs: 20_000 });
    return parseOrThrow(proxyConfigSchema, data, "proxy config");
  },
};

function transport(): WebshareTransport {
  return isTestMode() ? mockTransport : realTransport;
}

// ---------------------------------------------------------------------------
// API publik modul
// ---------------------------------------------------------------------------

export async function getActivePlan(apiKey: string): Promise<PlanInfo> {
  const plans = await transport().getPlans(apiKey);
  const active = plans.find((plan) => plan.status === "active");
  if (!active) throw new WebshareError("not_found", "Tidak ada plan dengan status active pada akun ini");
  return active;
}

export interface ApiKeyInfo {
  plan: PlanInfo;
  email: string | null;
}

/** Validasi API key: wajib punya plan aktif. Email bersifat opsional. */
export async function validateApiKey(apiKey: string): Promise<ApiKeyInfo> {
  const [plan, email] = await Promise.all([
    getActivePlan(apiKey),
    transport()
      .getProfileEmail(apiKey)
      .catch((error: unknown) => {
        console.warn("[webshare] gagal mengambil email profil", error);
        return null;
      }),
  ]);
  return { plan, email };
}

export interface BandwidthUsage {
  usedBytes: number;
  usedGb: number;
  /** GB; 0 = unlimited */
  limitGb: number;
  periodStart: string;
  periodEnd: string;
}

/**
 * Pemakaian bandwidth periode langganan berjalan.
 * - limit: plan aktif `bandwidth_limit` (GB, 0 = unlimited)
 * - periode: /api/v2/subscription/ `start_date` – `end_date`
 * - pemakaian: /api/v2/stats/aggregate/ `bandwidth_total` (bytes)
 *   Batasan docs: timestamp__gte tidak boleh lebih tua dari 90 hari,
 *   timestamp__lte tidak boleh melewati end_date langganan.
 * Tidak ada fallback ke 0: kegagalan dilempar sebagai error.
 */
export async function getBandwidthUsage(apiKey: string): Promise<BandwidthUsage> {
  const [plan, subscriptions] = await Promise.all([getActivePlan(apiKey), transport().getSubscriptions(apiKey)]);
  const subscription = subscriptions.find((s) => s.plan === plan.id) ?? subscriptions[0];
  if (!subscription) throw new WebshareError("invalid_response", "Data subscription tidak ditemukan");

  const now = Date.now();
  const start = new Date(subscription.start_date).getTime();
  const end = new Date(subscription.end_date).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new WebshareError("invalid_response", "Tanggal subscription tidak valid");
  }

  const gte = Math.max(start, now - 90 * DAY_MS + 60_000);
  const lte = Math.min(now, end);
  if (gte >= lte) throw new WebshareError("invalid_response", "Periode langganan tidak valid untuk statistik");

  const gteIso = new Date(gte).toISOString();
  const usedBytes = await transport().getAggregateBandwidthBytes(apiKey, gteIso, new Date(lte).toISOString(), plan.id);
  if (!Number.isFinite(usedBytes) || usedBytes < 0) {
    throw new WebshareError("invalid_response", `bandwidth_total tidak valid: ${usedBytes}`);
  }

  return {
    usedBytes,
    usedGb: usedBytes / BYTES_PER_GB,
    limitGb: plan.bandwidth_limit,
    periodStart: gteIso,
    periodEnd: subscription.end_date,
  };
}

export function listAllProxies(apiKey: string): Promise<ProxyItem[]> {
  return transport().listAllProxies(apiKey);
}

/** Negara yang tersedia untuk replace (tanpa ZZ dan tanpa yang bernilai 0). */
export async function getAvailableCountries(apiKey: string): Promise<Record<string, number>> {
  const raw = await transport().getAvailableCountriesRaw(apiKey);
  return Object.fromEntries(
    Object.entries(raw).filter(
      ([code, count]) => /^[A-Z]{2}$/i.test(code) && code.toUpperCase() !== "ZZ" && Number(count) > 0,
    ),
  );
}

export function createReplacement(apiKey: string, ip: string, target: ReplaceTarget): Promise<ReplacementJob> {
  return transport().createReplacement(apiKey, ip, target);
}

export function getReplacement(apiKey: string, id: number): Promise<ReplacementJob> {
  return transport().getReplacement(apiKey, id);
}

export type ReplacementOutcome = "success" | "failed" | "pending";

export function replacementOutcome(job: ReplacementJob): ReplacementOutcome {
  if (job.error || job.error_code || job.state === "failed") return "failed";
  if (job.state === "completed") return job.proxies_removed === 0 ? "failed" : "success";
  return "pending";
}

/** Poll replacement setiap `intervalMs` sampai selesai atau `timeoutMs` habis. */
export async function waitForReplacement(
  apiKey: string,
  initial: ReplacementJob,
  { timeoutMs = 25_000, intervalMs = 2_000 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<ReplacementJob> {
  const deadline = Date.now() + timeoutMs;
  let job = initial;
  while (replacementOutcome(job) === "pending" && Date.now() + intervalMs <= deadline) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    try {
      job = await getReplacement(apiKey, initial.id);
    } catch (error) {
      const transient =
        error instanceof WebshareError && ["network", "timeout", "upstream", "rate_limited"].includes(error.kind);
      if (!transient) throw error;
      console.warn("[webshare] polling replacement gagal sementara", error.message);
    }
  }
  return job;
}

export function listIpAuthorizations(apiKey: string): Promise<IpAuthorization[]> {
  return transport().listIpAuthorizations(apiKey);
}

export function addIpAuthorization(apiKey: string, ip: string): Promise<IpAuthorization> {
  return transport().addIpAuthorization(apiKey, ip);
}

export function deleteIpAuthorization(apiKey: string, id: number): Promise<void> {
  return transport().deleteIpAuthorization(apiKey, id);
}

/** Username & password proxy: 8–32 karakter alfanumerik (aturan Webshare). */
export const PROXY_CREDENTIAL_PATTERN = /^[a-zA-Z0-9]{8,32}$/;

const CREDENTIAL_CHARS = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCredential(length = 14): string {
  return Array.from({ length }, () => CREDENTIAL_CHARS[randomInt(CREDENTIAL_CHARS.length)]).join("");
}

export function getProxyConfig(apiKey: string): Promise<ProxyConfigInfo> {
  return transport().getProxyConfig(apiKey);
}

/** Ganti username dan/atau password proxy akun. Minimal satu field wajib diisi. */
export function updateProxyCredentials(apiKey: string, patch: ProxyCredentialPatch): Promise<ProxyConfigInfo> {
  const cleaned: ProxyCredentialPatch = {};
  for (const key of ["username", "password"] as const) {
    const value = patch[key];
    if (value === undefined) continue;
    if (!PROXY_CREDENTIAL_PATTERN.test(value)) {
      throw new WebshareError("bad_request", `${key} tidak memenuhi format 8-32 karakter alfanumerik`);
    }
    cleaned[key] = value;
  }
  if (!cleaned.username && !cleaned.password) {
    throw new WebshareError("bad_request", "Tidak ada perubahan kredensial yang dikirim");
  }
  return transport().updateProxyCredentials(apiKey, cleaned);
}

export { WebshareError };
export type { IpAuthorization, PlanInfo, ProxyConfigInfo, ProxyItem, ReplacementJob, ReplaceTarget, SubscriptionInfo };
