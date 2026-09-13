import { AlertIcon, ShopIcon, WhatsAppIcon } from "@/components/icons";
import { buttonClass, cn } from "@/components/ui";
import { SHOPEE_STORE_URL, waExtendLink } from "@/lib/links";

export function ExpiryBanner({
  orderNo,
  expired,
  daysLeft,
  expiresDateShort,
  graceEndsLabel,
  warningDays,
}: {
  orderNo: string;
  expired: boolean;
  daysLeft: number;
  expiresDateShort: string;
  graceEndsLabel: string;
  warningDays: number;
}) {
  if (!expired && daysLeft > warningDays) return null;

  return (
    <div
      role="alert"
      className={cn("animate-pop-in rounded-3xl border-2 border-ink p-5 sm:p-6", expired ? "bg-bad-soft" : "bg-warn-soft")}
    >
      <div className="flex gap-4">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full text-white",
            expired ? "bg-bad" : "bg-ink",
          )}
          aria-hidden="true"
        >
          <AlertIcon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg leading-tight font-extrabold tracking-tight uppercase sm:text-xl">
            {expired ? (
              <>
                Masa aktif <span className="text-bad">sudah berakhir</span>
              </>
            ) : (
              <>
                Proxy Anda akan expired <span className="text-brand-deep">dalam {daysLeft} hari</span>
              </>
            )}
          </p>
          <p className="mt-1 text-sm text-ink/80">
            {expired
              ? `Proxy expired sejak ${expiresDateShort}. Perpanjang sekarang agar proxy bisa digunakan kembali. Halaman ini tersedia hingga ${graceEndsLabel}.`
              : `Masa aktif berakhir pada ${expiresDateShort}. Perpanjang sebelum expired agar proxy tidak terputus.`}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <a href={SHOPEE_STORE_URL} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "md")}>
          <ShopIcon className="size-4" /> Perpanjang via Shopee
        </a>
        <a
          href={waExtendLink(orderNo, expiresDateShort)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("secondary", "md")}
        >
          <WhatsAppIcon className="size-4" /> Perpanjang via WhatsApp
        </a>
      </div>
    </div>
  );
}
