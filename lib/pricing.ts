/**
 * Daftar harga untuk halaman utama.
 * Ubah angka di sini saja — halaman harga ikut menyesuaikan otomatis.
 */

/** Masa aktif paket (hari). Dipakai di kartu harga dan FAQ. */
export const MASA_AKTIF_HARI = 30;

export interface Paket {
  ip: number;
  bandwidthGb: number;
  hargaRp: number;
  /** Tandai satu paket per kategori sebagai paling laris. */
  populer?: boolean;
}

export interface GrupPaket {
  label: string;
  paket: Paket[];
}

export interface KategoriHarga {
  id: string;
  nama: string;
  ringkasan: string;
  cocokUntuk: string[];
  grup: GrupPaket[];
}

export const KATEGORI_HARGA: KategoriHarga[] = [
  {
    id: "datacenter",
    nama: "Datacenter",
    ringkasan: "Kecepatan tinggi dengan harga paling hemat per IP. Pilihan utama untuk pekerjaan yang butuh banyak IP sekaligus.",
    cocokUntuk: ["Banyak akun sekaligus", "Kecepatan tinggi", "Harga paling hemat"],
    grup: [
      {
        label: "Bandwidth 250 GB",
        paket: [
          { ip: 50, bandwidthGb: 250, hargaRp: 72_000 },
          { ip: 100, bandwidthGb: 250, hargaRp: 132_000, populer: true },
          { ip: 200, bandwidthGb: 250, hargaRp: 208_000 },
        ],
      },
      {
        label: "Bandwidth 1.000 GB",
        paket: [
          { ip: 50, bandwidthGb: 1000, hargaRp: 149_000 },
          { ip: 100, bandwidthGb: 1000, hargaRp: 182_000 },
          { ip: 200, bandwidthGb: 1000, hargaRp: 241_000 },
        ],
      },
    ],
  },
  {
    id: "residential",
    nama: "Residential",
    ringkasan: "IP dari jaringan rumahan, jadi terlihat seperti pengguna biasa. Cocok untuk situs yang ketat.",
    cocokUntuk: ["Situs yang ketat", "Terlihat seperti pengguna rumahan", "Jumlah IP lebih sedikit"],
    grup: [
      {
        label: "Bandwidth 250 GB",
        paket: [
          { ip: 5, bandwidthGb: 250, hargaRp: 65_000 },
          { ip: 10, bandwidthGb: 250, hargaRp: 105_000, populer: true },
          { ip: 15, bandwidthGb: 250, hargaRp: 155_000 },
        ],
      },
    ],
  },
];

export function rupiah(nilai: number): string {
  return `Rp${new Intl.NumberFormat("id-ID").format(nilai)}`;
}

/** Harga per IP, untuk menunjukkan paket mana yang paling hemat. */
export function hargaPerIp(paket: Paket): string {
  return rupiah(Math.round(paket.hargaRp / paket.ip));
}

export function labelBandwidth(gb: number): string {
  return gb >= 1000 ? `${new Intl.NumberFormat("id-ID").format(gb)} GB` : `${gb} GB`;
}
