import Link from "next/link";
import { LogoMark } from "@/components/Brand";
import { WhatsAppIcon } from "@/components/icons";
import { LanguageToggle } from "@/components/landing/LanguageToggle";
import { buttonClass } from "@/components/ui";
import { checkoutEnabled } from "@/lib/env";
import { jalur } from "@/lib/i18n";
import { bahasaSekarang, kamus } from "@/lib/kamus";
import { waOrderGeneralLink } from "@/lib/links";

const navClass = "rounded-full px-3 py-2 text-sm font-bold text-ink transition-colors hover:bg-brand-softer";

export async function SiteHeader() {
  const k = await kamus();
  const bahasa = await bahasaSekarang();

  // Setiap tautan internal HARUS lewat jalur(): dari halaman /en, href "/account"
  // akan melompat balik ke versi Indonesia.
  const NAV = [
    { href: jalur(bahasa, "/#pricing"), label: k.nav.harga },
    { href: jalur(bahasa, "/#how-to-order"), label: k.nav.caraPesan },
    { href: jalur(bahasa, "/#faq"), label: k.nav.faq },
    { href: jalur(bahasa, "/blog"), label: k.nav.blog },
    { href: jalur(bahasa, "/account"), label: k.nav.akunSaya },
  ];

  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href={jalur(bahasa, "/")} className="flex shrink-0 items-center gap-2 text-ink">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-ink text-paper">
            <LogoMark className="size-7" />
          </span>
          <span className="font-display text-sm leading-none font-extrabold tracking-tight lowercase sm:text-base">
            dm<span className="text-brand">proxy</span>
          </span>
        </Link>

        <nav className="min-w-0 flex-1 overflow-x-auto" aria-label={k.nav.menuUtama}>
          <ul className="flex items-center justify-end gap-1 whitespace-nowrap sm:gap-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={navClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <LanguageToggle className="shrink-0" />

        {/* Checkout mandiri bisa dimatikan; tombolnya lalu kembali ke WhatsApp. */}
        {checkoutEnabled() ? (
          <Link
            href={jalur(bahasa, "/account/buy")}
            className={buttonClass("primary", "sm", "hidden shrink-0 sm:inline-flex")}
          >
            {k.umum.pesanSekarang}
          </Link>
        ) : (
          <a
            href={waOrderGeneralLink()}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("primary", "sm", "hidden shrink-0 sm:inline-flex")}
          >
            <WhatsAppIcon className="size-4" /> {k.umum.pesan}
          </a>
        )}
      </div>
    </header>
  );
}
