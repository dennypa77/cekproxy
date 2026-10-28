export type AccountStatus = "available" | "assigned" | "disabled";
export type ReplaceLogStatus = "pending" | "success" | "failed";

export interface WebshareAccount {
  id: string;
  label: string;
  email: string | null;
  api_key: string;
  status: AccountStatus;
  catatan: string | null;
  created_at: string;
  /** Info plan Webshare (diisi saat API key divalidasi). */
  proxy_type: string | null;
  proxy_subtype: string | null;
  proxy_count: number | null;
  bandwidth_limit_gb: number | null;
  plan_synced_at: string | null;
  /** Ikut menyumbang proxy ke pool rotating. */
  rotating_enabled: boolean;
  /** GB yang disisakan untuk customer statis (null = tanpa cadangan). */
  rotating_reserve_gb: number | null;
}

export type OrderType = "static" | "rotating";

export interface Order {
  id: string;
  shopee_order_no: string;
  /** 'static' = 1 pesanan 1 akun. 'rotating' = pool gabungan, akses lewat api_key. */
  order_type: OrderType;
  /** Kunci API khusus pesanan rotating. */
  api_key: string | null;
  /** Batas permintaan API rotating per menit. */
  rate_per_minute: number;
  account_id: string | null;
  nama_customer: string | null;
  expires_at: string;
  replace_quota: number;
  replace_used: number;
  replace_lock_until: string | null;
  is_active: boolean;
  catatan: string | null;
  created_at: string;
  /** Akun customer yang mengklaim pesanan ini (null = belum diklaim). */
  customer_id: string | null;
  claimed_at: string | null;
  /** Kode klaim sekali pakai; null begitu pesanan diklaim. */
  claim_code: string | null;
  claim_code_expires_at: string | null;
  /** Nomor WhatsApp pembeli (format 62…), dipakai kirim kode klaim & pengingat. */
  wa_number: string | null;
}

export interface ReplaceLog {
  id: string;
  order_id: string;
  old_ip: string;
  new_country: string;
  status: ReplaceLogStatus;
  error: string | null;
  replacement_id: number | null;
  created_at: string;
}

export type DbErrorCode =
  | "DUPLICATE"
  | "ACCOUNT_NOT_AVAILABLE"
  | "ORDER_NOT_FOUND"
  | "CLAIM_CODE_INVALID"
  | "CLAIM_CODE_EXPIRED"
  | "ALREADY_CLAIMED"
  | "UNKNOWN";

export class DbError extends Error {
  constructor(
    public readonly code: DbErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DbError";
  }
}

export interface NewAccountInput {
  label: string;
  email: string | null;
  api_key: string;
  catatan: string | null;
  proxy_type?: string | null;
  proxy_subtype?: string | null;
  proxy_count?: number | null;
  bandwidth_limit_gb?: number | null;
  plan_synced_at?: string | null;
}

export type AccountPatch = Partial<
  Pick<
    WebshareAccount,
    | "label"
    | "email"
    | "api_key"
    | "status"
    | "catatan"
    | "proxy_type"
    | "proxy_subtype"
    | "proxy_count"
    | "bandwidth_limit_gb"
    | "plan_synced_at"
    | "rotating_enabled"
    | "rotating_reserve_gb"
  >
>;

export interface NewOrderInput {
  shopee_order_no: string;
  account_id: string;
  nama_customer: string | null;
  expires_at: string;
  replace_quota: number;
  catatan: string | null;
  wa_number?: string | null;
}

export type OrderPatch = Partial<
  Pick<
    Order,
    | "shopee_order_no"
    | "nama_customer"
    | "expires_at"
    | "replace_quota"
    | "replace_used"
    | "is_active"
    | "catatan"
    | "api_key"
    | "rate_per_minute"
    | "customer_id"
    | "claimed_at"
    | "claim_code"
    | "claim_code_expires_at"
    | "wa_number"
  >
>;

export interface NewRotatingOrderInput {
  shopee_order_no: string;
  nama_customer: string | null;
  expires_at: string;
  api_key: string;
  rate_per_minute: number;
  catatan: string | null;
  wa_number?: string | null;
}

export interface NewReplaceLogInput {
  order_id: string;
  old_ip: string;
  new_country: string;
  status: ReplaceLogStatus;
  error: string | null;
  replacement_id: number | null;
}

export interface Customer {
  id: string;
  /** Kanonik: digit saja, diawali 62. */
  wa_number: string;
  nama: string;
  password_hash: string;
  /** Dinaikkan saat password diganti / akun diblokir → sesi lama batal. */
  session_version: number;
  is_blocked: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface NewCustomerInput {
  wa_number: string;
  nama: string;
  password_hash: string;
}

export type CustomerPatch = Partial<
  Pick<Customer, "nama" | "password_hash" | "session_version" | "is_blocked" | "last_login_at">
>;

export type WaTemplate = "claim_code" | "expiry_h3" | "expiry_h1" | "expired" | "manual";

export interface WaMessage {
  id: string;
  order_id: string | null;
  customer_id: string | null;
  to_number: string;
  template: WaTemplate;
  status: "sent" | "failed";
  error: string | null;
  provider_id: string | null;
  created_at: string;
}

export interface NewWaMessageInput {
  order_id: string | null;
  customer_id: string | null;
  to_number: string;
  template: WaTemplate;
  status: "sent" | "failed";
  error: string | null;
  provider_id: string | null;
}

/** Semua akses database lewat interface ini (Supabase atau memori untuk mode test). */
export interface Repo {
  listAccounts(): Promise<WebshareAccount[]>;
  getAccount(id: string): Promise<WebshareAccount | null>;
  findAccountByApiKey(apiKey: string): Promise<WebshareAccount | null>;
  createAccount(input: NewAccountInput): Promise<WebshareAccount>;
  updateAccount(id: string, patch: AccountPatch): Promise<void>;
  deleteAccount(id: string): Promise<void>;

  listOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | null>;
  getOrderByNo(orderNo: string): Promise<Order | null>;
  getOrderByApiKey(apiKey: string): Promise<Order | null>;
  createOrder(input: NewOrderInput): Promise<Order>;
  createRotatingOrder(input: NewRotatingOrderInput): Promise<Order>;
  updateOrder(id: string, patch: OrderPatch): Promise<void>;
  setOrderAccount(orderId: string, accountId: string | null): Promise<void>;
  extendOrder(orderId: string, days: number, newOrderNo: string | null): Promise<Order>;

  /** Naikkan replace_used + kunci proses secara atomik. false = tidak boleh replace. */
  tryStartReplace(orderId: string, lockSeconds: number): Promise<boolean>;
  releaseReplaceLock(orderId: string, rollback: boolean): Promise<void>;
  decrementReplaceUsed(orderId: string): Promise<void>;

  insertReplaceLog(input: NewReplaceLogInput): Promise<ReplaceLog>;
  listReplaceLogs(orderId: string, limit: number): Promise<ReplaceLog[]>;
  listPendingReplaceLogs(orderId: string): Promise<ReplaceLog[]>;
  /** Ubah log pending menjadi final. true jika log masih pending (klaim berhasil). */
  resolvePendingLog(logId: string, status: "success" | "failed", error: string | null): Promise<boolean>;

  listCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | null>;
  getCustomerByWa(waNumber: string): Promise<Customer | null>;
  createCustomer(input: NewCustomerInput): Promise<Customer>;
  updateCustomer(id: string, patch: CustomerPatch): Promise<void>;
  listOrdersByCustomer(customerId: string): Promise<Order[]>;
  /** Atomik: tautkan pesanan ke akun & matikan kodenya. Lempar DbError kalau kode tidak sah. */
  claimOrder(code: string, customerId: string): Promise<Order>;

  insertWaMessage(input: NewWaMessageInput): Promise<WaMessage>;
  listWaMessages(limit: number): Promise<WaMessage[]>;
  /** Sudah pernah terkirim sukses untuk pesanan + jenis pesan ini? */
  waMessageSent(orderId: string, template: WaTemplate): Promise<boolean>;

  rateLimitHit(key: string, windowSeconds: number): Promise<number>;
  rateLimitPeek(key: string): Promise<number>;

  cacheGet<T>(key: string): Promise<T | null>;
  cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  cacheDelete(key: string): Promise<void>;
}
