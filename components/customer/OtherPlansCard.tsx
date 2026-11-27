"use client";

import Link from "next/link";
import { ServerIcon, WhatsAppIcon } from "@/components/icons";
import { buttonClass, Card } from "@/components/ui";
import { jalur } from "@/lib/i18n";
import { useKamus } from "@/components/KamusProvider";
import { waOrderGeneralLink } from "@/lib/links";
import { KATEGORI_HARGA, usd } from "@/lib/pricing";

/** Harga termurah per kategori, supaya angkanya ikut kalau daftar harga diubah. */
const RINGKASAN = KATEGORI_HARGA.map((kategori) => ({
  nama: kategori.nama,
  mulai: Math.min(...kategori.grup.flatMap((grup) => grup.paket.map((paket) => paket.hargaRp))),
}));

/** Ajakan melihat paket lain (upgrade / tambah IP) di halaman utama. */
export function OtherPlansCard() {
  const { k, bahasa } = useKamus();
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
          <ServerIcon className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">
            {k.dasbor.paketLain.judul} <span className="text-brand">{k.dasbor.paketLain.aksen}</span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            {k.dasbor.paketLain.isi}{" "}
            {RINGKASAN.map((item, index) => (
              <span key={item.nama}>
                {index > 0 && " · "}
                {item.nama} {k.dasbor.paketLain.mulaiDari} <b className="text-ink">{usd(item.mulai)}</b>
              </span>
            ))}
            .
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link href={jalur(bahasa, "/#pricing")} className={buttonClass("primary", "sm")}>
            {k.dasbor.paketLain.lihatSemua}
          </Link>
          <a
            href={waOrderGeneralLink()}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("secondary", "sm")}
          >
            <WhatsAppIcon className="size-4" /> Ask the admin
          </a>
        </div>
      </div>
    </Card>
  );
}
