import { NextResponse } from "next/server";
import { getCronSecret } from "@/lib/env";
import { runExpiryNotifications } from "@/lib/services/notify";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Dipanggil Vercel Cron sekali sehari (lihat vercel.json).
 * Mengirim pengingat masa aktif ke WhatsApp customer.
 */
export async function GET(request: Request) {
  const secret = getCronSecret();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET belum diset." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  const header = request.headers.get("authorization") ?? "";
  if (header !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Tidak diizinkan." }, { status: 401, headers: { "cache-control": "no-store" } });
  }

  const dryRun = new URL(request.url).searchParams.get("dry") === "1";

  try {
    const hasil = await runExpiryNotifications({ dryRun });
    return NextResponse.json({ ok: true, data: hasil }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[cron] notifikasi gagal", error);
    return NextResponse.json(
      { ok: false, error: "Gagal menjalankan notifikasi." },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}
