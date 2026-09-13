import { cn, IconCircle } from "./ui";
import { ShieldCheckIcon, StopwatchIcon, ThumbUpIcon, XIcon } from "./icons";

/**
 * Logo DM Digital (digambar ulang sebagai SVG): cincin + monogram "DM".
 * Jika punya file logo asli, ganti isi komponen ini dengan <img src="/logo.svg" />.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className={className ?? "size-10"} role="img" aria-label="Logo DM Digital">
      <circle cx="50" cy="50" r="41" strokeWidth="6" />
      <path d="M28 32 L50 65 L72 32 V72" strokeWidth="10" strokeLinejoin="miter" />
      <path d="M28 32 V60" strokeWidth="10" />
    </svg>
  );
}

/** Tab hitam menggantung berisi logo (seperti pojok kanan atas foto produk). */
export function LogoTab({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) {
  return (
    <div
      className={cn(
        "flex items-end justify-center bg-ink text-white",
        size === "md" ? "rounded-b-[1.9rem] px-3 pt-6 pb-3" : "rounded-b-[1.4rem] px-2 pt-4 pb-2",
        className,
      )}
    >
      <LogoMark className={size === "md" ? "size-12" : "size-9"} />
    </div>
  );
}

export function Crosses({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-1.5 text-ink", className)} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <XIcon key={i} className="size-4" strokeWidth={4} />
      ))}
    </div>
  );
}

/** Pill terbelah "PROVIDE EZ SERVICE | DM DIGITAL". */
export function ServicePill({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex overflow-hidden rounded-full border-2 border-ink text-[11px] font-extrabold tracking-wide uppercase sm:text-xs",
        className,
      )}
    >
      <span className="bg-white px-4 py-2 text-ink">Provide EZ Service</span>
      <span className="bg-ink px-6 py-2 text-white">DM Digital</span>
    </div>
  );
}

const FEATURES = [
  { label: "Aman", icon: <ShieldCheckIcon className="size-4" /> },
  { label: "Trusted", icon: <ThumbUpIcon className="size-4" /> },
  { label: "Fast", icon: <StopwatchIcon className="size-4" /> },
];

export function FeatureBadges({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap justify-center gap-2", className)}>
      {FEATURES.map((feature) => (
        <li
          key={feature.label}
          className="inline-flex items-center gap-2 rounded-full bg-ink py-1 pr-4 pl-1 text-xs font-extrabold tracking-wide text-white uppercase"
        >
          <IconCircle>{feature.icon}</IconCircle>
          {feature.label}
        </li>
      ))}
    </ul>
  );
}

/** Kotak pola titik dekoratif. */
export function DotGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-[radial-gradient(#11111140_1.6px,transparent_1.6px)] bg-[length:14px_14px]", className)}
      aria-hidden="true"
    />
  );
}
