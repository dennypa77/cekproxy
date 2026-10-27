import { LogoMark } from "@/components/Brand";
import { WhatsAppIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import { waOrderGeneralLink } from "@/lib/links";

const NAV = [
  { href: "#harga", label: "Harga" },
  { href: "#cara-pesan", label: "Cara Pesan" },
  { href: "#cek-pesanan", label: "Cek Pesanan" },
  { href: "#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <a href="#atas" className="flex shrink-0 items-center gap-2 text-ink">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-ink text-white">
            <LogoMark className="size-7" />
          </span>
          <span className="font-display text-sm leading-none font-extrabold tracking-tight lowercase sm:text-base">
            dm<span className="text-brand">proxy</span>
          </span>
        </a>

        <nav className="min-w-0 flex-1 overflow-x-auto" aria-label="Menu utama">
          <ul className="flex items-center justify-end gap-1 whitespace-nowrap sm:gap-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded-full px-3 py-2 text-sm font-bold text-ink transition-colors hover:bg-brand-softer"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href={waOrderGeneralLink()}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("primary", "sm", "hidden shrink-0 sm:inline-flex")}
        >
          <WhatsAppIcon className="size-4" /> Pesan langsung
        </a>
      </div>
    </header>
  );
}
