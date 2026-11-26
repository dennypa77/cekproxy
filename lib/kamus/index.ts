import { lang } from "next/root-params";
import { BAHASA_BAWAAN, isBahasa, type Bahasa } from "@/lib/i18n";
import { en } from "./en";
import { id, type Kamus } from "./id";

export type { Kamus };

const SEMUA: Record<Bahasa, Kamus> = { id, en };

/** Kamus untuk bahasa tertentu. Dipakai komponen client lewat provider. */
export function kamusUntuk(bahasa: Bahasa): Kamus {
  return SEMUA[bahasa];
}

/**
 * Kamus untuk permintaan yang sedang berjalan.
 *
 * Bisa dipanggil dari KOMPONEN SERVER mana pun tanpa dioper lewat props,
 * karena [lang] adalah root param. Tidak bisa dipakai di komponen client,
 * server action, atau route handler — untuk komponen client, ambil dari
 * KamusProvider lewat useKamus().
 */
export async function kamus(): Promise<Kamus> {
  const nilai = await lang();
  return SEMUA[isBahasa(nilai) ? nilai : BAHASA_BAWAAN];
}

/** Bahasa yang sedang berjalan, untuk membuat tautan. */
export async function bahasaSekarang(): Promise<Bahasa> {
  const nilai = await lang();
  return isBahasa(nilai) ? nilai : BAHASA_BAWAAN;
}
