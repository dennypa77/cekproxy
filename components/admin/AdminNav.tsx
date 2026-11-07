"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/account", label: "Account Pool" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/proxy", label: "All Proxies" },
  { href: "/admin/customer", label: "Customers" },
  { href: "/admin/followup", label: "Follow-up" },
];

/** `checkout` dari server: menu Invoice hanya ada kalau checkout mandiri aktif. */
export function AdminNav({ checkout = false }: { checkout?: boolean }) {
  const pathname = usePathname();
  const links = checkout
    ? [...LINKS.slice(0, 3), { href: "/admin/invoice", label: "Invoices" }, ...LINKS.slice(3)]
    : LINKS;
  return (
    <nav className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-1">
      {links.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full border-2 px-4 py-1.5 text-sm font-bold whitespace-nowrap transition-colors",
              active ? "border-ink bg-ink text-paper" : "border-transparent text-ink hover:border-ink",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
