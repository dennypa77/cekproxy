/**
 * Dua bahasa: Indonesia (bawaan) dan Inggris.
 *
 * Indonesia berada di alamat utama tanpa awalan (`/harga`), Inggris di bawah
 * `/en` (`/en/harga`). Pembagiannya ditangani `proxy.ts` di akar proyek:
 * permintaan tanpa awalan ditulis ulang ke `/id/...` secara internal, jadi
 * alamat yang dilihat pengunjung tetap bersih.
 */

export const BAHASA = ["id", "en"] as const;

export type Bahasa = (typeof BAHASA)[number];

/** Bahasa yang dipakai kalau alamatnya tanpa awalan. */
export const BAHASA_BAWAAN: Bahasa = "id";

/** Bahasa yang alamatnya diberi awalan. Hanya Inggris; Indonesia di root. */
export const BAHASA_BERAWALAN: Bahasa[] = BAHASA.filter((b) => b !== BAHASA_BAWAAN);

export function isBahasa(nilai: string | undefined): nilai is Bahasa {
  return BAHASA.includes((nilai ?? "") as Bahasa);
}

/** Kode untuk atribut lang & hreflang, mis. "id-ID". */
export const KODE_HREFLANG: Record<Bahasa, string> = {
  id: "id-ID",
  en: "en",
};

export const NAMA_BAHASA: Record<Bahasa, string> = {
  id: "Bahasa Indonesia",
  en: "English",
};

/** Label pendek untuk tombol ganti bahasa. */
export const LABEL_SINGKAT: Record<Bahasa, string> = {
  id: "ID",
  en: "EN",
};

/**
 * Alamat sebuah halaman dalam bahasa tertentu.
 *
 * `path` selalu ditulis TANPA awalan bahasa (mis. "/account/buy"), supaya
 * komponen tidak perlu tahu sedang berada di bahasa apa saat membuat tautan.
 */
export function jalur(bahasa: Bahasa, path: string): string {
  const bersih = path.startsWith("/") ? path : `/${path}`;
  if (bahasa === BAHASA_BAWAAN) return bersih;
  return bersih === "/" ? `/${bahasa}` : `/${bahasa}${bersih}`;
}

/**
 * Buang awalan bahasa dari sebuah alamat.
 * "/en/account/buy" → "/account/buy" · "/account/buy" → "/account/buy"
 *
 * SEMUA bahasa dibuang, termasuk bahasa bawaan yang di alamat publik tidak
 * berawalan. Alasannya: `usePathname()` di komponen client mengembalikan
 * jalur INTERNAL hasil rewrite proxy — "/id/proxy-datacenter", bukan
 * "/proxy-datacenter". Kalau "id" tidak ikut dibuang, tombol ganti bahasa
 * menghasilkan "/en/id/proxy-datacenter".
 */
export function tanpaAwalan(pathname: string): string {
  for (const bahasa of BAHASA) {
    if (pathname === `/${bahasa}`) return "/";
    if (pathname.startsWith(`/${bahasa}/`)) return pathname.slice(bahasa.length + 1);
  }
  return pathname;
}

/**
 * Isi placeholder `{nama}` di teks kamus.
 *
 * Kamus sengaja HANYA berisi string, tidak ada fungsi: isinya dioper ke
 * komponen client lewat provider, dan fungsi tidak bisa menyeberangi batas
 * server→client. Angka yang berubah-ubah (masa aktif, batas wajar GB)
 * karena itu ditulis sebagai placeholder dan diisi di sini.
 */
export function isiVar(teks: string, nilai: Record<string, string | number>): string {
  return teks.replace(/\{(\w+)\}/g, (cocok, kunci) =>
    kunci in nilai ? String(nilai[kunci]) : cocok,
  );
}
