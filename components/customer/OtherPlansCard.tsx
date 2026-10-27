import Link from "next/link";
import { ServerIcon, WhatsAppIcon } from "@/components/icons";
import { buttonClass, Card } from "@/components/ui";
import { waOrderGeneralLink } from "@/lib/links";
import { KATEGORI_HARGA, rupiah } from "@/lib/pricing";

/** Harga termurah per kategori, supaya angkanya ikut kalau daftar harga diubah. */
const RINGKASAN = KATEGORI_HARGA.map((kategori) => ({
  nama: kategori.nama,
  mulai: Math.min(...kategori.grup.flatMap((grup) => grup.paket.map((paket) => paket.hargaRp))),
}));

/** Ajakan melihat paket lain (upgrade / tambah IP) di halaman utama. */
export function OtherPlansCard() {
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-white">
          <ServerIcon className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">
            Butuh <span className="text-brand">paket lain?</span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            Tambah IP, naikkan bandwidth, atau coba jenis proxy lain.{" "}
            {RINGKASAN.map((item, index) => (
              <span key={item.nama}>
                {index > 0 && " · "}
                {item.nama} mulai <b className="text-ink">{rupiah(item.mulai)}</b>
              </span>
            ))}
            .
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link href="/#harga" className={buttonClass("primary", "sm")}>
            Lihat semua paket
          </Link>
          <a
            href={waOrderGeneralLink()}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("secondary", "sm")}
          >
            <WhatsAppIcon className="size-4" /> Tanya admin
          </a>
        </div>
      </div>
    </Card>
  );
}
