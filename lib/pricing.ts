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

// ---------------------------------------------------------------------------
// Paket rotating (pool gabungan, dijual per durasi)
// ---------------------------------------------------------------------------

/**
 * Batas permintaan API per menit untuk semua paket rotating.
 *
 * Ini membatasi seberapa sering customer MENGAMBIL daftar proxy, bukan
 * berapa banyak data yang dialirkannya — trafiknya langsung ke Webshare,
 * tidak lewat server ini. Jadi angka ini bukan pengaman bandwidth; yang
 * menjaga pool adalah rotating_reserve_gb di tiap akun.
 */
export const ROTATING_RATE_PER_MINUTE = 60;

/** Batas wajar yang diumumkan ke customer (GB per 30 hari). */
export const ROTATING_FAIR_USE_GB = 100;

export interface PaketRotating {
  /** Pengenal stabil yang dirujuk invoice, mis. "rot-dc-30d". */
  sku: string;
  kategoriId: string;
  kategoriNama: string;
  hari: number;
  hargaRp: number;
  populer?: boolean;
}

/**
 * Dijual per DURASI, bukan per bandwidth: pemakaian tiap customer tidak bisa
 * diukur karena proxy-nya dipakai langsung ke Webshare.
 *
 * Harga 7 hari sengaja 40% dari harga 30 hari (bukan 23%) supaya durasi
 * pendek tidak jadi celah murah untuk menguras pool lalu pergi.
 */
export const PAKET_ROTATING: PaketRotating[] = [
  { sku: "rot-dc-7d", kategoriId: "datacenter", kategoriNama: "Datacenter", hari: 7, hargaRp: 38_000 },
  { sku: "rot-dc-14d", kategoriId: "datacenter", kategoriNama: "Datacenter", hari: 14, hargaRp: 61_000 },
  { sku: "rot-dc-30d", kategoriId: "datacenter", kategoriNama: "Datacenter", hari: 30, hargaRp: 95_000, populer: true },
  { sku: "rot-res-7d", kategoriId: "residential", kategoriNama: "Residential", hari: 7, hargaRp: 76_000 },
  { sku: "rot-res-14d", kategoriId: "residential", kategoriNama: "Residential", hari: 14, hargaRp: 118_000 },
  { sku: "rot-res-30d", kategoriId: "residential", kategoriNama: "Residential", hari: 30, hargaRp: 171_000, populer: true },
];

const ROTATING_BY_SKU = new Map(PAKET_ROTATING.map((paket) => [paket.sku, paket]));
// Ketahuan saat build, bukan saat customer memesan.
if (ROTATING_BY_SKU.size !== PAKET_ROTATING.length) {
  throw new Error("SKU paket rotating duplikat");
}
for (const sku of ROTATING_BY_SKU.keys()) {
  if (PAKET_BY_SKU.has(sku)) throw new Error(`SKU ${sku} dipakai paket statis dan rotating sekaligus`);
}

export function findPaketRotating(sku: string): PaketRotating | null {
  return ROTATING_BY_SKU.get(sku.trim().toLowerCase()) ?? null;
}

export function labelDurasi(hari: number): string {
  return `${hari} ${hari === 1 ? "day" : "days"}`;
}

export function namaPaketRotating(paket: PaketRotating): string {
  return `${paket.kategoriNama} Rotating · ${labelDurasi(paket.hari)}`;
}

/** Harga per hari, untuk menunjukkan durasi mana yang paling hemat. */
export function usdPerHari(paket: PaketRotating): string {
  const nilai = paket.hargaRp / paket.hari / IDR_PER_USD;
  return nilai >= 10 ? `${Math.round(nilai)}` : `${nilai.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Satu pintu untuk checkout: statis maupun rotating
// ---------------------------------------------------------------------------

/**
 * Bentuk seragam yang dipakai invoice. Kolom yang tidak relevan diisi 0
 * (bukan dikarang), dan migrasi 0006 menegakkan aturan itu di database:
 * rotating wajib ip = 0 dan bandwidth_gb = 0, statis wajib keduanya > 0.
 */
export interface ItemBeli {
  produk: "statis" | "rotating";
  sku: string;
  nama: string;
  kategoriId: string;
  ip: number;
  bandwidthGb: number;
  masaAktifHari: number;
  hargaRp: number;
  ratePerMinute: number | null;
}

/** Cari item dari SKU, statis atau rotating. Harga SELALU lewat fungsi ini. */
export function findItem(sku: string): ItemBeli | null {
  const statis = findPaket(sku);
  if (statis) {
    return {
      produk: "statis",
      sku: statis.sku,
      nama: `${statis.kategoriNama} ${statis.ip} IP · ${labelBandwidth(statis.bandwidthGb)}`,
      kategoriId: statis.kategoriId,
      ip: statis.ip,
      bandwidthGb: statis.bandwidthGb,
      masaAktifHari: MASA_AKTIF_HARI,
      hargaRp: statis.hargaRp,
      ratePerMinute: null,
    };
  }

  const rotating = findPaketRotating(sku);
  if (rotating) {
    return {
      produk: "rotating",
      sku: rotating.sku,
      nama: namaPaketRotating(rotating),
      kategoriId: rotating.kategoriId,
      ip: 0,
      bandwidthGb: 0,
      masaAktifHari: rotating.hari,
      hargaRp: rotating.hargaRp,
      ratePerMinute: ROTATING_RATE_PER_MINUTE,
    };
  }

  return null;
}
