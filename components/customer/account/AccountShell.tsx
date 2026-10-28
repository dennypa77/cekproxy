import Link from "next/link";
import type { ReactNode } from "react";
import { logoutCustomerAction } from "@/app/akun/actions";
import { LogoTab } from "@/components/Brand";
import { Decor } from "@/components/Decor";
import { UserIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";

/** Kerangka halaman akun: logo, sapaan, dan tombol keluar. */
export function AccountShell({
  nama,
  children,
  action,
}: {
  nama?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-10">
      <Decor />

      <div className="flex items-start justify-between">
        <Link href="/" className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-ink">
          ← Halaman utama
        </Link>
        <LogoTab size="sm" />
      </div>

      {nama && (
        <header className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-wider text-muted uppercase">Akun saya</p>
            <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight text-ink uppercase sm:text-3xl">
              Pesanan <span className="text-brand">Anda</span>
            </h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
              <UserIcon className="size-4" /> {nama}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {action}
            <form action={logoutCustomerAction}>
              <button type="submit" className={buttonClass("secondary", "sm")}>
                Keluar
              </button>
            </form>
          </div>
        </header>
      )}

      <div className="mt-6 space-y-5">{children}</div>
    </main>
  );
}
