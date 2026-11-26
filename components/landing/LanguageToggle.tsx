"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useKamus } from "@/components/KamusProvider";
import { cn } from "@/components/ui";
import { BAHASA, jalur, LABEL_SINGKAT, NAMA_BAHASA, tanpaAwalan } from "@/lib/i18n";

/**
 * Tombol ganti bahasa.
 *
 * Mempertahankan halaman yang sedang dibuka: dari /harga versi Indonesia
 * pindah ke /en/harga, bukan kembali ke beranda. Dibuat sebagai tautan biasa
 * (bukan tombol) supaya bisa dibuka di tab baru dan terbaca mesin pencari.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { bahasa, k } = useKamus();
  const pathname = usePathname() || "/";
  const dasar = tanpaAwalan(pathname);

  return (
    <div
      className={cn("inline-flex shrink-0 items-center rounded-full border-2 border-ink p-0.5", className)}
      role="group"
      aria-label={k.umum.gantiBahasa}
    >
      {BAHASA.map((b) => {
        const aktif = b === bahasa;
        return (
          <Link
            key={b}
            href={jalur(b, dasar)}
            hrefLang={b}
            aria-current={aktif ? "true" : undefined}
            title={NAMA_BAHASA[b]}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-extrabold transition-colors",
              aktif ? "bg-ink text-paper" : "text-muted hover:text-ink",
            )}
          >
            {LABEL_SINGKAT[b]}
          </Link>
        );
      })}
    </div>
  );
}
