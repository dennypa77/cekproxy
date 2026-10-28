import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/customer/AnnouncementBar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AkunLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      {children}
    </>
  );
}
