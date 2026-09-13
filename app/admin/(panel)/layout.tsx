import type { Metadata } from "next";
import { logoutAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoMark } from "@/components/Brand";
import { buttonClass } from "@/components/ui";
import { isMemoryDb } from "@/lib/db";
import { isTestMode } from "@/lib/env";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin DM Digital" },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2.5 font-display text-base font-extrabold tracking-tight uppercase">
              <span className="flex size-10 items-center justify-center rounded-full bg-ink text-white">
                <LogoMark className="size-7" />
              </span>
              Admin <span className="text-brand">DM Digital</span>
            </span>
            <form action={logoutAction} className="sm:hidden">
              <button type="submit" className={buttonClass("secondary", "xs")}>
                Keluar
              </button>
            </form>
          </div>
          <div className="flex items-center gap-2">
            <AdminNav />
            <form action={logoutAction} className="hidden sm:block">
              <button type="submit" className={buttonClass("secondary", "sm")}>
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      {isTestMode() && (
        <div className="border-b-2 border-ink bg-brand-soft px-4 py-2 text-center text-xs font-bold tracking-wide uppercase">
          Mode test aktif — data proxy adalah data palsu.
          {isMemoryDb() && " Database memori dipakai (data hilang saat server restart)."}
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
