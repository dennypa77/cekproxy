import "server-only";
import { cached, cacheKeys } from "../cache";
import type { WebshareAccount } from "../db";
import type { BandwidthResponse } from "../public-types";
import {
  getAvailableCountries,
  getBandwidthUsage,
  listAllProxies,
  type BandwidthUsage,
  type ProxyItem,
} from "../webshare";

const PROXIES_TTL = 60;
const COUNTRIES_TTL = 60 * 60;
const BANDWIDTH_TTL = 5 * 60;

export async function getProxies(account: WebshareAccount, options: { fresh?: boolean } = {}): Promise<ProxyItem[]> {
  const result = await cached(
    cacheKeys.proxies(account.id),
    PROXIES_TTL,
    () => listAllProxies(account.api_key),
    options.fresh ? { maxAgeSeconds: 3 } : {},
  );
  return result.value;
}

export async function getCountries(account: WebshareAccount): Promise<Record<string, number>> {
  return (await cached(cacheKeys.countries(account.id), COUNTRIES_TTL, () => getAvailableCountries(account.api_key)))
    .value;
}

/** Cache 5 menit per akun. Tombol refresh hanya melewati cache jika umurnya > 60 detik. */
export async function getBandwidth(
  account: WebshareAccount,
  options: { refresh?: boolean } = {},
): Promise<{ usage: BandwidthUsage; cachedAt: number }> {
  const result = await cached(
    cacheKeys.bandwidth(account.id),
    BANDWIDTH_TTL,
    () => getBandwidthUsage(account.api_key),
    options.refresh ? { maxAgeSeconds: 60 } : {},
  );
  return { usage: result.value, cachedAt: result.cachedAt };
}

export function toBandwidthResponse(usage: BandwidthUsage, cachedAt: number): BandwidthResponse {
  const unlimited = usage.limitGb <= 0;
  return {
    available: true,
    usedGb: Math.round(usage.usedGb * 100) / 100,
    limitGb: usage.limitGb,
    unlimited,
    percent: unlimited ? null : Math.round((usage.usedGb / usage.limitGb) * 1000) / 10,
    periodStart: usage.periodStart,
    periodEnd: usage.periodEnd,
    updatedAt: new Date(cachedAt).toISOString(),
  };
}

export const BANDWIDTH_UNAVAILABLE = "Data bandwidth sedang tidak tersedia";
