import "server-only";
import { getWaSenderConfig } from "./env";

/**
 * Pengirim WhatsApp lewat gateway HTTP (default: Fonnte).
 *
 * Sengaja dibuat netral supaya penyedia bisa diganti (mis. Meta Cloud API)
 * tanpa menyentuh pemanggil. Kalau FONNTE_TOKEN kosong, semua pengiriman
 * dilewati — jadi mode test dan lingkungan lokal tidak pernah mengirim pesan.
 */
export type SendResult =
  | { ok: true; providerId: string | null }
  | { ok: false; disabled?: true; error: string };

const TIMEOUT_MS = 15_000;

export function waSenderEnabled(): boolean {
  return getWaSenderConfig() !== null;
}

export async function sendWhatsApp(to: string, text: string): Promise<SendResult> {
  const config = getWaSenderConfig();
  if (!config) return { ok: false, disabled: true, error: "Pengiriman WhatsApp belum diaktifkan." };

  const body = new URLSearchParams({ target: to, message: text, countryCode: "62" });

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: { Authorization: config.token, "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });

    const raw = await response.text();
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}: ${raw.slice(0, 200)}` };
    }

    // Fonnte membalas JSON { status: boolean, id?: string[], reason?: string }
    try {
      const data = JSON.parse(raw) as { status?: boolean; id?: unknown; reason?: string; detail?: string };
      if (data.status === false) {
        return { ok: false, error: data.reason ?? data.detail ?? "Gateway menolak pesan." };
      }
      const id = Array.isArray(data.id) ? String(data.id[0]) : data.id ? String(data.id) : null;
      return { ok: true, providerId: id };
    } catch {
      // Balasan bukan JSON tapi status HTTP sukses — anggap terkirim.
      return { ok: true, providerId: null };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message.slice(0, 200) };
  }
}
