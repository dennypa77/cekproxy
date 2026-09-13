export type WebshareErrorKind =
  | "auth"
  | "not_found"
  | "bad_request"
  | "rate_limited"
  | "upstream"
  | "network"
  | "timeout"
  | "invalid_response";

/** Error mentah dari upstream. Pesannya HANYA untuk log/admin, jangan tampilkan ke customer. */
export class WebshareError extends Error {
  constructor(
    public readonly kind: WebshareErrorKind,
    message: string,
    public readonly status?: number,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "WebshareError";
  }
}

export interface PlanInfo {
  id: number;
  status: string;
  /** GB; 0 = unlimited */
  bandwidth_limit: number;
  proxy_type: string | null;
  proxy_subtype: string | null;
  proxy_count: number | null;
  proxy_replacements_available: number | null;
}

export interface SubscriptionInfo {
  id: number;
  plan: number | null;
  term: string | null;
  start_date: string;
  end_date: string;
  throttled: boolean | null;
}

export interface ProxyItem {
  proxy_address: string;
  port: number;
  username: string;
  password: string;
  country_code: string | null;
  valid: boolean;
}

export interface IpAuthorization {
  id: number;
  ip_address: string;
  created_at: string | null;
  last_used_at: string | null;
}

export type ReplacementState = "validating" | "validated" | "processing" | "completed" | "failed" | (string & {});

export interface ReplacementJob {
  id: number;
  state: ReplacementState;
  error: string | null;
  error_code: string | null;
  proxies_removed: number | null;
  proxies_added: number | null;
}

export type ReplaceTarget = { type: "any" } | { type: "country"; country_code: string };

/** Operasi tingkat rendah yang diimplementasikan oleh klien asli dan mock. */
export interface WebshareTransport {
  getPlans(apiKey: string): Promise<PlanInfo[]>;
  getSubscriptions(apiKey: string): Promise<SubscriptionInfo[]>;
  getProfileEmail(apiKey: string): Promise<string | null>;
  getAggregateBandwidthBytes(apiKey: string, gteIso: string, lteIso: string, planId: number): Promise<number>;
  listAllProxies(apiKey: string): Promise<ProxyItem[]>;
  getAvailableCountriesRaw(apiKey: string): Promise<Record<string, number>>;
  createReplacement(apiKey: string, ip: string, target: ReplaceTarget): Promise<ReplacementJob>;
  getReplacement(apiKey: string, id: number): Promise<ReplacementJob>;
  listIpAuthorizations(apiKey: string): Promise<IpAuthorization[]>;
  addIpAuthorization(apiKey: string, ip: string): Promise<IpAuthorization>;
  deleteIpAuthorization(apiKey: string, id: number): Promise<void>;
}
