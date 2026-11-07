import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/customer/AnnouncementBar";

/** Pengumuman tampil di semua halaman pesanan, termasuk saat pesanan tidak ditemukan. */
export default function PesananLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      {children}
    </>
  );
}
