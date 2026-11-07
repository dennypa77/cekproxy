/**
 * Daftar harga untuk halaman utama.
 * Ubah angka di sini saja — halaman harga ikut menyesuaikan otomatis.
 */

/** Masa aktif paket (hari). Dipakai di kartu harga dan FAQ. */
export const MASA_AKTIF_HARI = 30;

export interface Paket {
  /** Pengenal stabil yang dirujuk invoice, mis. "dc-100ip-250gb". */
  sku: string;
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
    ringkasan: "High speed at the lowest price per IP. The go-to choice when you need many IPs at once.",
    cocokUntuk: ["Many accounts at once", "High speed", "Lowest cost per IP"],
    grup: [
      {
        label: "Bandwidth 250 GB",
        paket: [
          { sku: "dc-50ip-250gb", ip: 50, bandwidthGb: 250, hargaRp: 72_000 },
          { sku: "dc-100ip-250gb", ip: 100, bandwidthGb: 250, hargaRp: 132_000, populer: true },
          { sku: "dc-200ip-250gb", ip: 200, bandwidthGb: 250, hargaRp: 208_000 },
          { sku: "dc-500ip-250gb", ip: 500, bandwidthGb: 250, hargaRp: 523_000 },
          { sku: "dc-1000ip-250gb", ip: 1000, bandwidthGb: 250, hargaRp: 781_000 },
        ],
      },
      {
        label: "Bandwidth 1.000 GB",
        paket: [
          { sku: "dc-50ip-1000gb", ip: 50, bandwidthGb: 1000, hargaRp: 149_000 },
          { sku: "dc-100ip-1000gb", ip: 100, bandwidthGb: 1000, hargaRp: 182_000 },
          { sku: "dc-200ip-1000gb", ip: 200, bandwidthGb: 1000, hargaRp: 241_000 },
          { sku: "dc-500ip-1000gb", ip: 500, bandwidthGb: 1000, hargaRp: 699_000 },
        ],
      },
    ],
  },
  {
    id: "residential",
    nama: "Residential",
    ringkasan: "IPs from real home networks, so you look like an ordinary user. Ideal for strict sites.",
    cocokUntuk: ["Strict sites", "Looks like a home user", "Up to 100 IPs"],
    grup: [
      {
        label: "Bandwidth 250 GB",
        paket: [
          { sku: "res-5ip-250gb", ip: 5, bandwidthGb: 250, hargaRp: 65_000 },
          { sku: "res-10ip-250gb", ip: 10, bandwidthGb: 250, hargaRp: 105_000, populer: true },
          { sku: "res-15ip-250gb", ip: 15, bandwidthGb: 250, hargaRp: 155_000 },
          { sku: "res-25ip-250gb", ip: 25, bandwidthGb: 250, hargaRp: 255_000 },
          { sku: "res-50ip-250gb", ip: 50, bandwidthGb: 250, hargaRp: 505_000 },
          { sku: "res-100ip-250gb", ip: 100, bandwidthGb: 250, hargaRp: 1_005_000 },
        ],
      },
    ],
  },
];

export function rupiah(nilai: number): string {
  return `Rp${new Intl.NumberFormat("id-ID").format(nilai)}`;
}

/**
 * Kurs tetap IDR→USD untuk tampilan harga internasional.
 * USD adalah harga utama; IDR tampil sebagai sekunder. Ubah angka ini saja
 * kalau kursnya bergeser — semua harga USD ikut menyesuaikan.
 */
export const IDR_PER_USD = 19_000;

/** Harga USD (dolar penuh, dibulatkan) dari harga Rupiah. */
export function usd(hargaRp: number): string {
  return `$${Math.max(1, Math.round(hargaRp / IDR_PER_USD))}`;
}

/**
 * Harga per IP dalam USD, untuk menunjukkan paket mana yang paling hemat.
 *
 * Dibulatkan ke sen, bukan ke dolar penuh: hampir semua paket ada di bawah
 * $1 per IP, jadi pembulatan ke dolar membuat semua baris terlihat sama.
 */
export function usdPerIp(paket: Paket): string {
  const nilai = paket.hargaRp / paket.ip / IDR_PER_USD;
  return nilai >= 10 ? `$${Math.round(nilai)}` : `$${nilai.toFixed(2)}`;
}

/** Harga per IP (Rupiah), untuk menunjukkan paket mana yang paling hemat. */
export function hargaPerIp(paket: Paket): string {
  return rupiah(Math.round(paket.hargaRp / paket.ip));
}

export function labelBandwidth(gb: number): string {
  return gb >= 1000 ? `${new Intl.NumberFormat("en-US").format(gb)} GB` : `${gb} GB`;
}

export interface PaketLengkap extends Paket {
  kategoriId: string;
  kategoriNama: string;
  grupLabel: string;
}

/** Semua paket dari semua kategori, sudah diratakan untuk katalog & checkout. */
export const SEMUA_PAKET: PaketLengkap[] = KATEGORI_HARGA.flatMap((kategori) =>
  kategori.grup.flatMap((grup) =>
    grup.paket.map((paket) => ({
      ...paket,
      kategoriId: kategori.id,
      kategoriNama: kategori.nama,
      grupLabel: grup.label,
    })),
  ),
);

const PAKET_BY_SKU = new Map(SEMUA_PAKET.map((paket) => [paket.sku, paket]));
// Ketahuan saat build, bukan saat customer memesan.
if (PAKET_BY_SKU.size !== SEMUA_PAKET.length) {
  throw new Error("SKU paket duplikat di KATEGORI_HARGA");
}

/** Cari paket dari SKU. Harga untuk invoice SELALU diambil lewat fungsi ini, bukan dari form. */
export function findPaket(sku: string): PaketLengkap | null {
  return PAKET_BY_SKU.get(sku.trim().toLowerCase()) ?? null;
}

export function namaPaket(paket: Paket & { kategoriNama?: string }): string {
  const kategori = paket.kategoriNama ? `${paket.kategoriNama} ` : "";
  return `${kategori}${paket.ip} IP · ${labelBandwidth(paket.bandwidthGb)}`;
}
