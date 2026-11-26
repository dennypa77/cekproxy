import { ShieldCheckIcon, StopwatchIcon, ThumbUpIcon } from "@/components/icons";
import { cn, IconCircle } from "@/components/ui";
import { kamus } from "@/lib/kamus";

/**
 * Badge Aman / Terpercaya / Cepat.
 *
 * Dipisah dari Brand.tsx karena butuh kamus, sedangkan Brand.tsx ikut
 * dipakai komponen client dan panel admin — keduanya tidak bisa memanggil
 * next/root-params.
 */
export async function FeatureBadges({ className }: { className?: string }) {
  const k = await kamus();
  const FEATURES = [
    { label: k.merek.aman, icon: <ShieldCheckIcon className="size-4" /> },
    { label: k.merek.terpercaya, icon: <ThumbUpIcon className="size-4" /> },
    { label: k.merek.cepat, icon: <StopwatchIcon className="size-4" /> },
  ];

  return (
    <ul className={cn("flex flex-wrap justify-center gap-2", className)}>
      {FEATURES.map((feature) => (
        <li
          key={feature.label}
          className="inline-flex items-center gap-2 rounded-full bg-ink py-1 pr-4 pl-1 text-xs font-extrabold tracking-wide text-paper uppercase"
        >
          <IconCircle>{feature.icon}</IconCircle>
          {feature.label}
        </li>
      ))}
    </ul>
  );
}

