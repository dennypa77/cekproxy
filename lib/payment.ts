/**
 * Metode pembayaran manual. Nomor rekening memang perlu dilihat pembeli,
 * jadi disimpan sebagai konstanta — tapi hanya dirender di halaman invoice
 * milik customer yang bersangkutan, tidak pernah di halaman publik.
 *
 * Bisa ditimpa lewat env kalau rekening berubah:
 *   BANK_BCA="0810655801|Denny Permata Ariawan"
 */

export type MetodeBayar = "qris" | "bca" | "bri";

export interface InfoMetode {
  kode: MetodeBayar;
  nama: string;
  /** Nomor rekening (kosong untuk QRIS). */
  nomor: string | null;
  atasNama: string;
  /** Gambar QRIS di folder public (hanya untuk metode qris). */
  gambar?: string;
  petunjuk: string;
}

const ATAS_NAMA_DEFAULT = "Denny Permata Ariawan";

function dariEnv(nama: string): { nomor: string; atasNama: string } | null {
  const value = process.env[nama]?.trim();
  if (!value) return null;
  const [nomor, atasNama] = value.split("|");
  if (!nomor?.trim()) return null;
  return { nomor: nomor.trim(), atasNama: atasNama?.trim() || ATAS_NAMA_DEFAULT };
}

export function metodeBayar(): InfoMetode[] {
  const bca = dariEnv("BANK_BCA") ?? { nomor: "0810655801", atasNama: ATAS_NAMA_DEFAULT };
  const bri = dariEnv("BANK_BRI") ?? { nomor: "345901026678506", atasNama: ATAS_NAMA_DEFAULT };

  return [
    {
      kode: "qris",
      nama: "QRIS",
      nomor: null,
      atasNama: process.env.QRIS_NAMA?.trim() || ATAS_NAMA_DEFAULT,
      gambar: process.env.QRIS_IMAGE?.trim() || "/qris.png",
      petunjuk: "Scan the QR code with any bank or e-wallet app, then enter the exact amount shown below.",
    },
    {
      kode: "bca",
      nama: "BCA Transfer",
      nomor: bca.nomor,
      atasNama: bca.atasNama,
      petunjuk: "Transfer to the BCA account below using the exact amount, including the last 3 digits.",
    },
    {
      kode: "bri",
      nama: "BRI Transfer",
      nomor: bri.nomor,
      atasNama: bri.atasNama,
      petunjuk: "Transfer to the BRI account below using the exact amount, including the last 3 digits.",
    },
  ];
}

export function findMetode(kode: string): InfoMetode | null {
  return metodeBayar().find((m) => m.kode === kode) ?? null;
}

export const METODE_LABEL: Record<MetodeBayar, string> = {
  qris: "QRIS",
  bca: "BCA Transfer",
  bri: "BRI Transfer",
};
