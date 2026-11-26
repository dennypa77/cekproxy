import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import { checkoutEnabled } from "@/lib/env";
import { jalur } from "@/lib/i18n";
import { bahasaSekarang, kamus } from "@/lib/kamus";
import { waOrderGeneralLink, waOrderLink } from "@/lib/links";
import { labelDurasi, usd, type Paket, type PaketRotating } from "@/lib/pricing";

/**
 * Tombol "Order" di daftar harga.
 *
 * Checkout mandiri bisa dimatikan lewat env `CHECKOUT_ENABLED`. Selama mati,
 * tombol ini membuka WhatsApp dengan paket yang sudah terisi — persis seperti
 * sebelum ada invoice — sehingga halaman harga tetap berguna tanpa perlu
 * menyembunyikan apa pun.
 */
export async function OrderButton({ paket, kategori }: { paket: Paket; kategori: string }) {
  const k = await kamus();
  const bahasa = await bahasaSekarang();
  const judul = `${k.umum.pesan} ${kategori} ${paket.ip} IP`;

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
        <WhatsAppIcon className="size-4" /> {k.umum.pesan}
      </a>
    );
  }

  return (
    <Link
      href={jalur(bahasa, `/account/buy?sku=${encodeURIComponent(paket.sku)}`)}
      className={buttonClass("primary", "sm")}
      title={judul}
    >
      {k.umum.pesan}
    </Link>
  );
}

/**
 * Tombol "Order" untuk paket rotating.
 *
 * Dipisah dari OrderButton karena isinya memang beda: rotating tidak punya
 * jumlah IP maupun kuota GB untuk ditulis di pesan WhatsApp — yang menentukan
 * cuma kategori pool dan durasinya.
 */
export async function RotatingOrderButton({ paket }: { paket: PaketRotating }) {
  const k = await kamus();
  const bahasa = await bahasaSekarang();
  const judul = `${k.umum.pesan} ${paket.kategoriNama} Rotating ${labelDurasi(paket.hari)}`;

  if (!checkoutEnabled()) {
    return (
      <a
        href={waOrderGeneralLink()}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass("primary", "sm")}
        title={judul}
      >
        <WhatsAppIcon className="size-4" /> {k.umum.pesan}
      </a>
    );
  }

  return (
    <Link
      href={jalur(bahasa, `/account/buy?sku=${encodeURIComponent(paket.sku)}`)}
      className={buttonClass("primary", "sm")}
      title={judul}
    >
      {k.umum.pesan}
    </Link>
  );
}
