import Link from "next/link";
import { Crosses, LogoTab, ServicePill } from "@/components/Brand";
import { Decor } from "@/components/Decor";
import { SearchIcon, ShopIcon, StatusIcon, WhatsAppIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import { SHOPEE_STORE_URL, waHelpLink } from "@/lib/links";
import type { StatusIconName } from "@/lib/public-types";

export function NotAvailable({
  title,
  body,
  icon = "search",
  orderNo,
  showShopee = false,
}: {
  title: string;
  body: string;
  icon?: StatusIconName;
  orderNo?: string;
  showShopee?: boolean;
}) {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-10">
      <Decor />
      <div className="flex items-start justify-between">
        <Crosses className="mt-6" />
        <LogoTab size="sm" />
      </div>

      <div className="my-auto pt-8">
        <div className="animate-pop-in rounded-3xl border-2 border-ink bg-white p-6 text-center">
          <span className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-ink text-white" aria-hidden="true">
            <StatusIcon name={icon} className="size-7" />
          </span>
          <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight text-ink">{title}</h1>
          <p className="mt-3 text-sm text-muted">{body}</p>
          {orderNo && (
            <p className="mt-4 inline-block rounded-full border-2 border-ink bg-paper px-3 py-1 font-mono text-xs font-semibold">
              No. pesanan: {orderNo}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <Link href="/" className={buttonClass("primary", "lg", "w-full")}>
              <SearchIcon className="size-5" /> Cek nomor pesanan lain
            </Link>
            {showShopee && (
              <a href={SHOPEE_STORE_URL} target="_blank" rel="noopener noreferrer" className={buttonClass("brand", "lg", "w-full")}>
                <ShopIcon className="size-5" /> Order lagi via Shopee
              </a>
            )}
            <a href={waHelpLink(orderNo)} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "lg", "w-full")}>
              <WhatsAppIcon className="size-5" /> Hubungi admin
            </a>
          </div>
        </div>
        <div className="mt-8 flex justify-center">
          <ServicePill />
        </div>
      </div>
    </main>
  );
}
