/**
 * Pilihan lokasi (negara) saat checkout.
 *
 * Sebelum ini customer hanya bisa menulis permintaan negara di kolom catatan
 * bebas, dan sering kali tidak menulis apa-apa — jadi admin harus menebak atau
 * bertanya lewat chat. Sekarang lokasi WAJIB dipilih sebelum invoice dibuat.
 *
 * Daftarnya DIPISAH PER KATEGORI karena stok datacenter dan residential
 * memang berbeda: menawarkan Rusia di paket residential hanya akan membuat
 * pesanan yang tidak bisa Anda penuhi.
 *
 * Ubah daftar di bawah sesuai stok yang benar-benar bisa disediakan —
 * halaman checkout ikut menyesuaikan sendiri, tidak ada yang perlu disentuh
 * di komponen UI.
 */

/** Negara untuk paket datacenter (statis maupun rotating). */
export const NEGARA_DATACENTER = [
  "ID", // Indonesia
  "MY", // Malaysia
  "SG", // Singapore
  "HK", // Hong Kong
  "JP", // Japan
  "IN", // India
  "CN", // China
  "IL", // Israel
  "AU", // Australia
  "US", // United States
  "CA", // Canada
  "MX", // Mexico
  "GB", // United Kingdom
  "DE", // Germany
  "FR", // France
  "NL", // Netherlands
  "BE", // Belgium
  "AT", // Austria
  "CZ", // Czechia
  "HU", // Hungary
  "IT", // Italy
  "PL", // Poland
  "RO", // Romania
  "FI", // Finland
  "NO", // Norway
  "RU", // Russian Federation
] as const;

/** Negara untuk paket residential (statis maupun rotating). */
export const NEGARA_RESIDENTIAL = [
  "US", // United States
  "CA", // Canada
  "GB", // United Kingdom
  "DE", // Germany
  "FR", // France
  "IT", // Italy
  "BE", // Belgium
  "PL", // Poland
  "RO", // Romania
  "SE", // Sweden
  "JP", // Japan
  "KR", // South Korea
  "HK", // Hong Kong
  "AU", // Australia
] as const;

const PER_KATEGORI: Record<string, readonly string[]> = {
  datacenter: NEGARA_DATACENTER,
  residential: NEGARA_RESIDENTIAL,
};

/** Negara yang boleh dipilih untuk sebuah kategori paket. */
export function negaraTersedia(kategoriId: string): readonly string[] {
  return PER_KATEGORI[kategoriId] ?? [];
}

/** Nilai khusus: biarkan admin yang memilih negara terbaik yang tersedia. */
export const LOKASI_ACAK = "RANDOM";

export interface RincianLokasi {
  kode: string;
  /** Jumlah IP untuk negara ini. 0 = tanpa jumlah (paket rotating). */
  jumlah: number;
}

export type PilihanLokasi = { acak: true; rincian: [] } | { acak: false; rincian: RincianLokasi[] };

export type HasilLokasi = { ok: true; pilihan: PilihanLokasi; teks: string } | { ok: false; error: string };

/**
 * Baca pilihan lokasi dari form.
 *
 * Bentuk yang diterima:
 *   "RANDOM"          → biar admin yang pilih
 *   "US:2,KR:3"       → paket statis, jumlah per negara WAJIB pas dengan jumlah IP
 *   "US,KR"           → paket rotating, cukup daftar negara yang disukai
 *
 * `totalIp` = 0 berarti paket rotating: tidak ada jumlah yang perlu dicocokkan,
 * karena negaranya dipilih per panggilan API, bukan saat pembelian.
 */
export function parseLokasi(raw: string | undefined, totalIp: number, kategoriId: string): HasilLokasi {
  const value = (raw ?? "").trim();
  if (!value) return { ok: false, error: "Please choose at least one location." };

  if (value.toUpperCase() === LOKASI_ACAK) {
    return { ok: true, pilihan: { acak: true, rincian: [] }, teks: LOKASI_ACAK };
  }

  const tersedia = new Set(negaraTersedia(kategoriId));
  if (tersedia.size === 0) return { ok: false, error: "No locations are configured for this plan." };

  const rincian: RincianLokasi[] = [];
  const sudahAda = new Set<string>();

  for (const bagian of value.split(",")) {
    const potongan = bagian.trim();
    if (!potongan) continue;

    const [kodeMentah, jumlahMentah] = potongan.split(":");
    const kode = (kodeMentah ?? "").trim().toUpperCase();

    if (!tersedia.has(kode)) return { ok: false, error: "That location is not available for this plan." };
    if (sudahAda.has(kode)) return { ok: false, error: "The same location was selected twice." };
    sudahAda.add(kode);

    if (totalIp === 0) {
      rincian.push({ kode, jumlah: 0 });
      continue;
    }

    const jumlah = Number.parseInt((jumlahMentah ?? "").trim(), 10);
    if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > totalIp) {
      return { ok: false, error: "Please enter how many IPs you want per location." };
    }
    rincian.push({ kode, jumlah });
  }

  if (rincian.length === 0) return { ok: false, error: "Please choose at least one location." };

  if (totalIp > 0) {
    const jumlahTotal = rincian.reduce((total, item) => total + item.jumlah, 0);
    if (jumlahTotal !== totalIp) {
      return {
        ok: false,
        error: `Your locations add up to ${jumlahTotal} IPs, but this plan has ${totalIp}. Please adjust.`,
      };
    }
  }

  const teks =
    totalIp === 0
      ? rincian.map((item) => item.kode).join(",")
      : rincian.map((item) => `${item.kode}:${item.jumlah}`).join(",");

  return { ok: true, pilihan: { acak: false, rincian }, teks };
}

/** Versi yang enak dibaca admin, mis. "United States 2, South Korea 3". */
export function lokasiTerbaca(teks: string | null, nama: (kode: string) => string): string {
  if (!teks || !teks.trim()) return "Not specified";
  if (teks.trim().toUpperCase() === LOKASI_ACAK) return "Random — we choose";

  return teks
    .split(",")
    .map((bagian) => {
      const [kode, jumlah] = bagian.trim().split(":");
      const label = nama(kode.trim().toUpperCase());
      return jumlah ? `${label} ${jumlah}` : label;
    })
    .join(", ");
}
