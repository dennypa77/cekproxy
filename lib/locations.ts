/**
 * Pilihan lokasi (negara) saat checkout.
 *
 * Sebelum ini customer hanya bisa menulis permintaan negara di kolom catatan
 * bebas, dan sering kali tidak menulis apa-apa — jadi admin harus menebak atau
 * bertanya lewat chat. Sekarang lokasi WAJIB dipilih sebelum invoice dibuat.
 *
 * Daftar negaranya dikelola di sini. Tambah atau kurangi sesuai stok yang
 * benar-benar bisa Anda sediakan — halaman checkout ikut menyesuaikan sendiri.
 */

/** Kode negara yang ditawarkan di checkout. Nama negaranya dari Intl, tidak perlu ditulis. */
export const NEGARA_TERSEDIA = [
  "US", // United States
  "GB", // United Kingdom
  "DE", // Germany
  "NL", // Netherlands
  "FR", // France
  "CA", // Canada
  "JP", // Japan
  "KR", // South Korea
  "SG", // Singapore
  "AU", // Australia
  "BR", // Brazil
  "IN", // India
] as const;

/** Nilai khusus: biarkan admin yang memilih negara terbaik yang tersedia. */
export const LOKASI_ACAK = "RANDOM";

const TERSEDIA = new Set<string>(NEGARA_TERSEDIA);

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
export function parseLokasi(raw: string | undefined, totalIp: number): HasilLokasi {
  const value = (raw ?? "").trim();
  if (!value) return { ok: false, error: "Please choose at least one location." };

  if (value.toUpperCase() === LOKASI_ACAK) {
    return { ok: true, pilihan: { acak: true, rincian: [] }, teks: LOKASI_ACAK };
  }

  const rincian: RincianLokasi[] = [];
  const sudahAda = new Set<string>();

  for (const bagian of value.split(",")) {
    const potongan = bagian.trim();
    if (!potongan) continue;

    const [kodeMentah, jumlahMentah] = potongan.split(":");
    const kode = (kodeMentah ?? "").trim().toUpperCase();

    if (!TERSEDIA.has(kode)) return { ok: false, error: "That location is not available." };
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
