export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

/** fetch JSON ke API internal; semua error diubah menjadi pesan yang ramah. */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    const json = (await response.json().catch(() => null)) as
      | { ok: true; data: T }
      | { ok: false; error: string }
      | null;
    if (!response.ok || !json || !json.ok) {
      return {
        ok: false,
        status: response.status,
        error: json && !json.ok && json.error ? json.error : "Terjadi kesalahan. Silakan coba lagi.",
      };
    }
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, status: 0, error: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda." };
  }
}

export function orderApi(orderNo: string, path: string): string {
  return `/api/pesanan/${encodeURIComponent(orderNo)}/${path}`;
}
