import Link from "next/link";
import { LogoMark } from "@/components/Brand";
import { WhatsAppIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import { checkoutEnabled } from "@/lib/env";
import { waHelpLink, waOrderGeneralLink } from "@/lib/links";

const PRODUCTS = [
  { href: "/proxy-datacenter", label: "Datacenter proxies" },
  { href: "/proxy-residential", label: "Residential proxies" },
  { href: "/proxy-rotating-api", label: "Rotating proxy API" },
  { href: "/tools/what-is-my-ip", label: "What is my IP" },
  { href: "/blog", label: "Blog" },
];

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-ink bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-ink text-paper">
            <LogoMark className="size-7" />
          </span>
          <div>
            <p className="font-display text-sm font-extrabold tracking-tight text-ink lowercase">dmproxy</p>
            <p className="text-xs text-muted">Provide EZ Service</p>
          </div>
        </div>

        <nav aria-label="Products" className="flex flex-col gap-2 text-sm">
          <p className="text-xs font-bold tracking-wider text-muted uppercase">Products</p>
          {PRODUCTS.map((p) => (
            <Link key={p.href} href={p.href} className="font-semibold text-ink hover:text-brand hover:underline">
              {p.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-wrap gap-2 sm:flex-col">
          {/* Checkout mandiri bisa dimatikan; tombolnya lalu kembali ke WhatsApp. */}
          {checkoutEnabled() ? (
            <Link href="/account/buy" className={buttonClass("primary", "sm")}>
              Buy a plan
            </Link>
          ) : (
            <a href={waOrderGeneralLink()} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "sm")}>
              <WhatsAppIcon className="size-4" /> Order on WhatsApp
            </a>
          )}
          <a href={waHelpLink()} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
            <WhatsAppIcon className="size-4" /> Help
          </a>
        </div>
      </div>
    </footer>
  );
}
