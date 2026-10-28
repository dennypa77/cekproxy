import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { formatDate } from "@/lib/format";

/**
 * Pita masa transisi: halaman pesanan masih terbuka, tapi sebentar lagi
 * hanya bisa dibuka lewat akun. Hanya tampil kalau tanggalnya sudah diset
 * dan pesanan ini belum masuk akun siapa pun.
 */
export function LoginNotice({ orderNo, enforceFrom }: { orderNo: string; enforceFrom: string | null }) {
  if (!enforceFrom) return null;

  return (
    <div className="border-b-2 border-ink bg-warn-soft">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-snug font-semibold text-ink">
          Mulai {formatDate(enforceFrom)}, halaman ini hanya bisa dibuka lewat akun. Buat akun sekarang lalu klaim
          pesanan {orderNo} dengan kode dari admin.
        </p>
        <div className="flex shrink-0 gap-2">
          <Link href={`/akun/daftar?next=/pesanan/${encodeURIComponent(orderNo)}`} className={buttonClass("primary", "sm")}>
            Buat akun
          </Link>
          <Link href={`/akun/masuk?next=/pesanan/${encodeURIComponent(orderNo)}`} className={buttonClass("secondary", "sm")}>
            Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
