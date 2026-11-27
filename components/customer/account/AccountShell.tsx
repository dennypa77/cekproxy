import Link from "next/link";
import { jalur } from "@/lib/i18n";
import { bahasaSekarang, kamus } from "@/lib/kamus";
import type { ReactNode } from "react";
import { logoutCustomerAction } from "@/app/_actions/account";
import { LogoTab } from "@/components/Brand";
import { Decor } from "@/components/Decor";
import { UserIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";

/** Kerangka halaman akun: logo, sapaan, dan tombol keluar. */
export async function AccountShell({
  nama,
  children,
  action,
  judul,
  aksen,
  eyebrow,
}: {
  nama?: string;
  children: ReactNode;
  action?: ReactNode;
  /** Judul halaman; kata kedua diberi warna aksen. */
  judul?: string;
  aksen?: string;
  eyebrow?: string;
}) {
  const k = await kamus();
  const bahasa = await bahasaSekarang();
  const judulAkhir = judul ?? k.akun.judul;
  const aksenAkhir = aksen ?? k.akun.aksen;
  const eyebrowAkhir = eyebrow ?? k.akun.eyebrow;

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-10">
      <Decor />

      <div className="flex items-start justify-between">
        <Link
          href={jalur(bahasa, "/")}
          className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-ink"
        >
          {k.akun.kembali}
        </Link>
        <LogoTab size="sm" />
      </div>

      {nama && (
        <header className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-wider text-muted uppercase">{eyebrowAkhir}</p>
            <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight text-ink uppercase sm:text-3xl">
              {judulAkhir} <span className="text-brand">{aksenAkhir}</span>
            </h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
              <UserIcon className="size-4" /> {nama}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {action}
            <form action={logoutCustomerAction}>
              <button type="submit" className={buttonClass("secondary", "sm")}>
                {k.akun.keluar}
              </button>
            </form>
          </div>
        </header>
      )}

      <div className="mt-6 space-y-5">{children}</div>
    </main>
  );
}
