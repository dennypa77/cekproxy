import type { Metadata } from "next";
import { BAHASA, BAHASA_BAWAAN, isBahasa, jalur, KODE_HREFLANG, type Bahasa } from "./i18n";

/**
 * Canonical + hreflang untuk satu halaman, dalam kedua bahasa.
 *
 * `path` ditulis TANPA awalan bahasa, mis. "/proxy-datacenter".
 *
 * Kenapa harus per halaman, bukan sekali di layout: metadata halaman
 * MENIMPA metadata layout untuk field yang sama. Begitu sebuah halaman
 * menyetel `alternates.canonical` sendiri, seluruh `alternates` dari layout
 * hilang — termasuk hreflang-nya. Ini sempat terjadi dan tidak terlihat
 * sampai HTML-nya diperiksa langsung.
 */
export function alternatesDuaBahasa(bahasa: Bahasa, path: string): Metadata["alternates"] {
  return {
    canonical: jalur(bahasa, path),
    languages: {
      ...Object.fromEntries(BAHASA.map((b) => [KODE_HREFLANG[b], jalur(b, path)])),
      // Pengunjung dengan bahasa lain diarahkan ke versi Indonesia.
      "x-default": jalur(BAHASA_BAWAAN, path),
    },
  };
}

/** Baca bahasa dari params rute; apa pun yang aneh dianggap bahasa bawaan. */
export function bahasaDari(lang: string | undefined): Bahasa {
  return isBahasa(lang) ? lang : BAHASA_BAWAAN;
}
