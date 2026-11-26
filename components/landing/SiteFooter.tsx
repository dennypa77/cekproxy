import Link from "next/link";
import { LogoMark } from "@/components/Brand";
import { WhatsAppIcon } from "@/components/icons";
import { LanguageToggle } from "@/components/landing/LanguageToggle";
import { buttonClass } from "@/components/ui";
import { checkoutEnabled } from "@/lib/env";
import { jalur } from "@/lib/i18n";
import { bahasaSekarang, kamus } from "@/lib/kamus";
import { waHelpLink, waOrderGeneralLink } from "@/lib/links";

export async function SiteFooter() {
  const k = await kamus();
  const bahasa = await bahasaSekarang();

  const PRODUK = [
    { href: "/proxy-datacenter", label: k.footer.produkDatacenter },
    { href: "/proxy-residential", label: k.footer.produkResidential },
    { href: "/proxy-rotating-api", label: k.footer.produkRotating },
    { href: "/tools/what-is-my-ip", label: k.footer.produkCekIp },
    { href: "/blog", label: k.footer.produkBlog },
  ];

  return (
    <footer className="border-t-2 border-ink bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-ink text-paper">
            <LogoMark className="size-7" />
          </span>
          <div>
            <p className="font-display text-sm font-extrabold tracking-tight text-ink lowercase">dmproxy</p>
            <p className="text-xs text-muted">{k.footer.tagline}</p>
          </div>
        </div>

        <nav aria-label={k.footer.produk} className="flex flex-col gap-2 text-sm">
          <p className="text-xs font-bold tracking-wider text-muted uppercase">{k.footer.produk}</p>
          {PRODUK.map((p) => (
            <Link
              key={p.href}
              href={jalur(bahasa, p.href)}
              className="font-semibold text-ink hover:text-brand hover:underline"
            >
              {p.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-wrap items-start gap-2 sm:flex-col">
          {/* Checkout mandiri bisa dimatikan; tombolnya lalu kembali ke WhatsApp. */}
          {checkoutEnabled() ? (
            <Link href={jalur(bahasa, "/account/buy")} className={buttonClass("primary", "sm")}>
              {k.umum.beliPaket}
            </Link>
          ) : (
            <a
              href={waOrderGeneralLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("primary", "sm")}
            >
              <WhatsAppIcon className="size-4" /> {k.umum.pesanLewatWa}
            </a>
          )}
          <a href={waHelpLink()} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
            <WhatsAppIcon className="size-4" /> {k.umum.bantuan}
          </a>
          <LanguageToggle />
        </div>
      </div>
    </footer>
  );
}
