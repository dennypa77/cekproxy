import "server-only";
import {
  WebshareError,
  type IpAuthorization,
  type PlanInfo,
  type ProxyItem,
  type ReplacementJob,
  type ReplaceTarget,
  type SubscriptionInfo,
  type WebshareTransport,
} from "./webshare-types";

/*
 * Mock API Webshare untuk WEBSHARE_TEST_MODE=true.
 * State disimpan di memori proses (hilang saat restart; di Vercel tiap instance punya state sendiri).
 *
 * API key khusus:
 *   mock-key-1        → 150 proxy (uji paginasi), bandwidth 210/250 GB (kuning)
 *   mock-key-2        → 10 proxy, bandwidth 97/100 GB (merah)
 *   key lain          → 10 proxy, bandwidth unlimited
 *   mengandung "invalid"     → API key ditolak (401)
 *   mengandung "nobw"        → statistik bandwidth gagal
 *   mengandung "slowreplace" → replace butuh 40 detik (uji status "pending")
 *   mengandung "failreplace" → replace selalu gagal
 */

interface MockJob {
  id: number;
  ip: string;
  target: ReplaceTarget;
  createdAt: number;
  durationMs: number;
  error: string | null;
  applied: boolean;
}

interface MockAccount {
  plan: PlanInfo;
  subscription: SubscriptionInfo;
  email: string;
  usedBytes: number;
  proxies: ProxyItem[];
  ipAuths: IpAuthorization[];
  nextIpAuthId: number;
  jobs: Map<number, MockJob>;
  random: () => number;
}

const AVAILABLE_COUNTRIES: Record<string, number> = {
  US: 520,
  DE: 140,
  GB: 95,
  SG: 60,
  JP: 42,
  ID: 18,
  FR: 0,
  ZZ: 7,
};
const LIST_COUNTRIES = ["US", "US", "US", "DE", "GB", "SG", "JP", "ID"];
const DAY_MS = 86_400_000;
const GB = 1_000_000_000;

const globalStore = globalThis as unknown as { __dmWebshareMock?: Map<string, MockAccount>; __dmMockJobSeq?: number };

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomIp(random: () => number): string {
  const octet = () => Math.floor(random() * 254) + 1;
  return `${[23, 45, 64, 82, 104, 138, 154, 172, 185, 193][Math.floor(random() * 10)]}.${octet()}.${octet()}.${octet()}`;
}

function randomPassword(random: () => number): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: 12 }, () => chars[Math.floor(random() * chars.length)]).join("");
}

function accountFor(apiKey: string): MockAccount {
  if (apiKey.includes("invalid") || apiKey.trim().length < 6) {
    throw new WebshareError("auth", "Invalid token.", 401, { detail: "Invalid token." });
  }
  globalStore.__dmWebshareMock ??= new Map();
  const store = globalStore.__dmWebshareMock;
  const existing = store.get(apiKey);
  if (existing) return existing;

  const seed = hash(apiKey);
  const random = mulberry32(seed);
  const profile =
    apiKey === "mock-key-1"
      ? { count: 150, limit: 250, used: 210.4, email: "demo1@example.com" }
      : apiKey === "mock-key-2"
        ? { count: 10, limit: 100, used: 97.2, email: "demo2@example.com" }
        : apiKey === "mock-key-3"
          ? { count: 25, limit: 50, used: 3.1, email: "demo3@example.com" }
          : { count: 10, limit: 0, used: 12.3, email: `mock-${seed.toString(16).slice(0, 6)}@example.com` };

  const username = `dm${seed.toString(36).slice(0, 6)}`;
  const password = randomPassword(random);
  const now = Date.now();

  const account: MockAccount = {
    plan: {
      id: 100000 + (seed % 900000),
      status: "active",
      bandwidth_limit: profile.limit,
      proxy_type: "dedicated",
      proxy_subtype: "default",
      proxy_count: profile.count,
      proxy_replacements_available: 1000,
    },
    subscription: {
      id: 500000 + (seed % 400000),
      plan: 100000 + (seed % 900000),
      term: "monthly",
      start_date: new Date(now - 10 * DAY_MS).toISOString(),
      end_date: new Date(now + 20 * DAY_MS).toISOString(),
      throttled: false,
    },
    email: profile.email,
    usedBytes: Math.round(profile.used * GB),
    proxies: Array.from({ length: profile.count }, () => ({
      proxy_address: randomIp(random),
      port: 1000 + Math.floor(random() * 9000),
      username,
      password,
      country_code: LIST_COUNTRIES[Math.floor(random() * LIST_COUNTRIES.length)],
      valid: random() > 0.06,
    })),
    ipAuths: [
      { id: 1, ip_address: "103.47.132.10", created_at: new Date(now - 3 * DAY_MS).toISOString(), last_used_at: null },
    ],
    nextIpAuthId: 2,
    jobs: new Map(),
    random,
  };
  store.set(apiKey, account);
  return account;
}

async function latency(min = 150, max = 500): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

function jobState(account: MockAccount, job: MockJob): ReplacementJob {
  const elapsed = Date.now() - job.createdAt;
  const base = { id: job.id, error_code: null, proxies_added: null, proxies_removed: null };

  if (job.error) {
    return elapsed < 1500
      ? { ...base, state: "validating", error: null }
      : { ...base, state: "failed", error: job.error, error_code: "replacement_failed" };
  }
  if (elapsed < job.durationMs * 0.25) return { ...base, state: "validating", error: null };
  if (elapsed < job.durationMs * 0.5) return { ...base, state: "validated", error: null };
  if (elapsed < job.durationMs) return { ...base, state: "processing", error: null };

  if (!job.applied) {
    job.applied = true;
    const proxy = account.proxies.find((p) => p.proxy_address === job.ip);
    if (!proxy) {
      job.error = "No proxies matched to_replace.";
      return { ...base, state: "failed", error: job.error, error_code: "no_proxies_matched" };
    }
    proxy.proxy_address = randomIp(account.random);
    proxy.port = 1000 + Math.floor(account.random() * 9000);
    proxy.valid = true;
    proxy.country_code =
      job.target.type === "country"
        ? job.target.country_code
        : LIST_COUNTRIES[Math.floor(account.random() * LIST_COUNTRIES.length)];
  }
  return { ...base, state: "completed", error: null, proxies_added: 1, proxies_removed: 1 };
}

export const mockTransport: WebshareTransport = {
  async getPlans(apiKey) {
    await latency();
    return [structuredClone(accountFor(apiKey).plan)];
  },

  async getSubscriptions(apiKey) {
    await latency();
    return [structuredClone(accountFor(apiKey).subscription)];
  },

  async getProfileEmail(apiKey) {
    await latency();
    return accountFor(apiKey).email;
  },

  async getAggregateBandwidthBytes(apiKey) {
    await latency(300, 800);
    const account = accountFor(apiKey);
    if (apiKey.includes("nobw")) throw new WebshareError("upstream", "Stats service unavailable", 503);
    // simulasi pemakaian bertambah sedikit setiap kali dicek
    account.usedBytes += Math.round(account.random() * 5_000_000);
    return account.usedBytes;
  },

  async listAllProxies(apiKey) {
    await latency(300, 900);
    return structuredClone(accountFor(apiKey).proxies);
  },

  async getAvailableCountriesRaw(apiKey) {
    await latency();
    accountFor(apiKey);
    return { ...AVAILABLE_COUNTRIES };
  },

  async createReplacement(apiKey, ip, target) {
    await latency();
    const account = accountFor(apiKey);
    globalStore.__dmMockJobSeq = (globalStore.__dmMockJobSeq ?? 90000) + 1;
    const id = globalStore.__dmMockJobSeq;

    let error: string | null = null;
    if (apiKey.includes("failreplace")) error = "Replacement failed due to insufficient supply.";
    else if (!account.proxies.some((p) => p.proxy_address === ip)) error = "No proxies matched to_replace.";
    else if (target.type === "country" && !(AVAILABLE_COUNTRIES[target.country_code] > 0)) {
      error = `Not enough proxies available in ${target.country_code}.`;
    }

    account.jobs.set(id, {
      id,
      ip,
      target,
      createdAt: Date.now(),
      durationMs: apiKey.includes("slowreplace") ? 40_000 : 6_000,
      error,
      applied: false,
    });
    return { id, state: "validating", error: null, error_code: null, proxies_added: null, proxies_removed: null };
  },

  async getReplacement(apiKey, id) {
    await latency(100, 300);
    const account = accountFor(apiKey);
    const job = account.jobs.get(id);
    if (!job) throw new WebshareError("not_found", "Not found.", 404);
    return jobState(account, job);
  },

  async listIpAuthorizations(apiKey) {
    await latency();
    return structuredClone(accountFor(apiKey).ipAuths);
  },

  async addIpAuthorization(apiKey, ip) {
    await latency();
    const account = accountFor(apiKey);
    if (account.ipAuths.some((a) => a.ip_address === ip)) {
      throw new WebshareError("bad_request", "IP address is already authorized.", 400, {
        ip_address: ["IP address is already authorized."],
      });
    }
    if (account.ipAuths.length >= 5) {
      throw new WebshareError("bad_request", "Maximum number of IP authorizations reached.", 400, {
        non_field_errors: ["Maximum number of IP authorizations reached."],
      });
    }
    const entry: IpAuthorization = {
      id: account.nextIpAuthId++,
      ip_address: ip,
      created_at: new Date().toISOString(),
      last_used_at: null,
    };
    account.ipAuths.push(entry);
    return structuredClone(entry);
  },

  async getProxyConfig(apiKey) {
    await latency();
    const account = accountFor(apiKey);
    const first = account.proxies[0];
    return { username: first?.username ?? "dmuser0000", password: first?.password ?? "mockpass0000", state: "completed" };
  },

  async updateProxyCredentials(apiKey, patch) {
    await latency(400, 900);
    const account = accountFor(apiKey);
    for (const proxy of account.proxies) {
      if (patch.username) proxy.username = patch.username;
      if (patch.password) proxy.password = patch.password;
    }
    const first = account.proxies[0];
    return {
      username: patch.username ?? first?.username ?? "dmuser0000",
      password: patch.password ?? first?.password ?? "mockpass0000",
      state: "completed",
    };
  },

  async deleteIpAuthorization(apiKey, id) {
    await latency();
    const account = accountFor(apiKey);
    const before = account.ipAuths.length;
    account.ipAuths = account.ipAuths.filter((a) => a.id !== id);
    if (account.ipAuths.length === before) throw new WebshareError("not_found", "Not found.", 404);
  },
};
