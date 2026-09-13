/** Tipe data yang aman dikirim ke browser (tanpa API key / data internal). */

export interface PublicProxy {
  ip: string;
  port: number;
  username: string;
  password: string;
  country: string | null;
  valid: boolean;
}

export interface ProxiesResponse {
  proxies: PublicProxy[];
  replaceUsed: number;
  replaceQuota: number;
  pendingReplace: boolean;
  masked: boolean;
}

export type BandwidthResponse =
  | {
      available: true;
      usedGb: number;
      limitGb: number;
      unlimited: boolean;
      percent: number | null;
      periodStart: string;
      periodEnd: string;
      updatedAt: string;
    }
  | { available: false; message: string };

export interface CountryOption {
  code: string;
  count: number;
}

export interface WhitelistEntry {
  id: number;
  ip: string;
  createdAt: string | null;
  lastUsedAt: string | null;
}

export interface ReplaceResponse {
  status: "success" | "pending";
  message: string;
  replaceUsed: number;
  replaceQuota: number;
}

export interface MyIpResponse {
  ip: string | null;
  isIPv4: boolean;
}

export const PROXY_FORMATS = ["ip:port:user:pass", "user:pass@ip:port", "ip:port"] as const;
export type ProxyFormat = (typeof PROXY_FORMATS)[number];

export function formatProxy(p: PublicProxy, format: ProxyFormat): string {
  switch (format) {
    case "user:pass@ip:port":
      return `${p.username}:${p.password}@${p.ip}:${p.port}`;
    case "ip:port":
      return `${p.ip}:${p.port}`;
    default:
      return `${p.ip}:${p.port}:${p.username}:${p.password}`;
  }
}

/** Nama ikon untuk pesan status (dipakai server & client). */
export type StatusIconName = "search" | "pause" | "clock" | "tool" | "alert" | "slow" | "offline" | "edit";

export type AdminActionState = {
  ok: boolean;
  message: string;
  details?: string[];
};
