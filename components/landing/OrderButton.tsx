import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import { checkoutEnabled } from "@/lib/env";
import { waOrderLink } from "@/lib/links";
import { usd, type Paket } from "@/lib/pricing";

/**
 * Tombol "Order" di daftar harga.
 *
 * Checkout mandiri bisa dimatikan lewat env `CHECKOUT_ENABLED`. Selama mati,
 * tombol ini membuka WhatsApp dengan paket yang sudah terisi — persis seperti
 * sebelum ada invoice — sehingga halaman harga tetap berguna tanpa perlu
 * menyembunyikan apa pun.
 */
export function OrderButton({ paket, kategori }: { paket: Paket; kategori: string }) {
  const judul = `Order ${kategori} ${paket.ip} IP`;

  if (!checkoutEnabled()) {
    return (
      <a
        href={waOrderLink({
          kategori,
          ip: paket.ip,
          bandwidthGb: paket.bandwidthGb,
          harga: usd(paket.hargaRp),
        })}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass("primary", "sm")}
        title={judul}
      >
        <WhatsAppIcon className="size-4" /> Order
      </a>
    );
  }

  return (
    <Link href={`/account/buy?sku=${encodeURIComponent(paket.sku)}`} className={buttonClass("primary", "sm")} title={judul}>
      Order
    </Link>
  );
}
