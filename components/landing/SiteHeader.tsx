import Link from "next/link";
import { LogoMark } from "@/components/Brand";

import { buttonClass } from "@/components/ui";


const NAV = [
  { href: "/#pricing", label: "Pricing" },
  { href: "/#how-to-order", label: "How to order" },
  { href: "/#faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/account", label: "My account" },
];

const navClass = "rounded-full px-3 py-2 text-sm font-bold text-ink transition-colors hover:bg-brand-softer";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-ink">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-ink text-paper">
            <LogoMark className="size-7" />
          </span>
          <span className="font-display text-sm leading-none font-extrabold tracking-tight lowercase sm:text-base">
            dm<span className="text-brand">proxy</span>
          </span>
        </Link>

        <nav className="min-w-0 flex-1 overflow-x-auto" aria-label="Main menu">
          <ul className="flex items-center justify-end gap-1 whitespace-nowrap sm:gap-2">
            {NAV.map((item) => (
              <li key={item.href}>
                {item.href.startsWith("#") ? (
                  <a href={item.href} className={navClass}>
                    {item.label}
                  </a>
                ) : (
                  <Link href={item.href} className={navClass}>
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <Link href="/account/buy" className={buttonClass("primary", "sm", "hidden shrink-0 sm:inline-flex")}>
          Order now
        </Link>

      </div>
    </header>
  );
}
