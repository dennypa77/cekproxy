import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

const VARIANTS = {
  /** Aksi utama: pill hitam */
  primary: "border-2 border-ink bg-ink text-white hover:bg-[#2b2b2b] disabled:border-ink/30 disabled:bg-ink/30",
  /** Aksen biru */
  brand: "border-2 border-brand-deep bg-brand-deep text-white hover:border-[#075ec0] hover:bg-[#075ec0] disabled:opacity-50",
  secondary:
    "border-2 border-ink bg-white text-ink hover:bg-brand-softer disabled:border-ink/25 disabled:text-ink/35 disabled:hover:bg-white",
  danger: "border-2 border-bad bg-bad text-white hover:bg-[#b83232] disabled:opacity-50",
  dangerSoft: "border-2 border-ink bg-white text-bad hover:bg-bad-soft disabled:border-ink/25 disabled:opacity-50",
  ghost: "border-2 border-transparent text-ink hover:bg-ink/5 disabled:opacity-40 disabled:hover:bg-transparent",
  // alias agar pemanggil lama tetap konsisten dengan tema
  shopee: "border-2 border-ink bg-ink text-white hover:bg-[#2b2b2b]",
  whatsapp: "border-2 border-ink bg-white text-ink hover:bg-brand-softer",
} as const;

const SIZES = {
  xs: "h-8 gap-1 px-3 text-xs",
  sm: "h-9 gap-1.5 px-3.5 text-sm",
  md: "h-11 gap-2 px-5 text-sm",
  lg: "h-13 gap-2.5 px-6 text-base",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string): string {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap transition-colors select-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed",
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean }) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className ?? "size-5")} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Ikon di dalam lingkaran (seperti badge AMAN / TRUSTED / FAST). */
export function IconCircle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn("flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-ink", className)}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-3xl border-2 border-ink bg-white p-5 sm:p-6", className)}>{children}</section>
  );
}

/** Judul kartu gaya poster: huruf besar tebal, kata aksen berwarna biru. */
export function CardHeader({
  title,
  accent,
  description,
  icon,
  action,
}: {
  title: string;
  accent?: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-white"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-display text-lg leading-tight font-extrabold tracking-tight text-ink uppercase sm:text-xl">
            {title} {accent && <span className="text-brand">{accent}</span>}
          </h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

const BADGE_TONES = {
  green: "bg-ok-soft",
  red: "bg-bad-soft",
  yellow: "bg-warn-soft",
  blue: "bg-brand-soft",
  gray: "bg-white",
} as const;

export function Badge({ tone = "gray", children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border-2 border-ink px-2 py-0.5 text-xs font-bold whitespace-nowrap text-ink",
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Pill hitam bergaya label produk, dengan ikon opsional di lingkaran putih. */
export function Pill({
  icon,
  children,
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-ink py-1 text-xs font-extrabold tracking-wide text-white uppercase",
        icon ? "pr-4 pl-1" : "px-4 py-1.5",
        className,
      )}
    >
      {icon && <IconCircle className="size-6">{icon}</IconCircle>}
      {children}
    </span>
  );
}

export const inputClass =
  "block w-full rounded-2xl border-2 border-ink bg-white px-4 py-2.5 text-base font-medium text-ink outline-none transition placeholder:font-normal placeholder:text-ink/35 focus:border-brand-deep focus:ring-4 focus:ring-brand/20 disabled:bg-paper disabled:text-ink/40 sm:text-sm";

export const labelClass = "mb-1.5 block text-xs font-bold tracking-wide text-ink uppercase";
