"use client";

import { useEffect, useState } from "react";
import { XIcon } from "@/components/icons";

const STORAGE_PREFIX = "dm_pengumuman_";

export function AnnouncementBarClient({ id, text }: { id: string; text: string }) {
  const [dismissed, setDismissed] = useState(false);

  // Tampil dulu, lalu disembunyikan kalau customer pernah menutupnya
  // (localStorage tidak bisa dibaca saat render di server).
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_PREFIX + id) === "1") setDismissed(true);
    } catch {
      // mode privat / storage diblokir: biarkan pengumuman tampil
    }
  }, [id]);

  if (dismissed) return null;

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_PREFIX + id, "1");
    } catch {
      // tidak apa-apa, pengumuman muncul lagi saat halaman dibuka ulang
    }
  };

  return (
    <div className="relative border-b-2 border-ink bg-brand-soft" role="status">
      <div className="mx-auto flex max-w-3xl items-start gap-3 px-4 py-2.5 pr-12 sm:items-center">
        <p className="text-sm leading-snug font-semibold text-ink">{text}</p>
      </div>
      <button
        type="button"
        onClick={close}
        aria-label="Tutup pengumuman"
        className="absolute top-1.5 right-2 flex size-8 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/10 focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none"
      >
        <XIcon className="size-4" strokeWidth={3} />
      </button>
    </div>
  );
}
