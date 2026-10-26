import "server-only";
import { createHash } from "node:crypto";
import { endOfJakartaDay } from "./format";

export interface Announcement {
  /** Dipakai sebagai kunci "sudah ditutup" di browser customer. */
  id: string;
  text: string;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Pengumuman untuk halaman customer, diatur lewat env:
 * - `PENGUMUMAN`       : isi teks. Kosong = tidak ada pita pengumuman.
 * - `PENGUMUMAN_SAMPAI`: "YYYY-MM-DD" (opsional). Lewat 23:59 WIB tanggal itu,
 *                        pita hilang sendiri tanpa perlu deploy ulang.
 *
 * Teks yang diganti menghasilkan id baru, jadi pengumuman baru tetap muncul
 * walau customer pernah menutup pengumuman sebelumnya.
 */
export function getAnnouncement(): Announcement | null {
  const text = process.env.PENGUMUMAN?.trim();
  if (!text) return null;

  const until = process.env.PENGUMUMAN_SAMPAI?.trim();
  if (until && DATE_PATTERN.test(until)) {
    const deadline = Date.parse(endOfJakartaDay(until));
    if (!Number.isNaN(deadline) && Date.now() > deadline) return null;
  }

  return { id: createHash("sha256").update(text).digest("hex").slice(0, 10), text };
}
