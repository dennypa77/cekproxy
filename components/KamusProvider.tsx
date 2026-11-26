"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Bahasa } from "@/lib/i18n";
import type { Kamus } from "@/lib/kamus/id";

/**
 * Kamus untuk komponen client.
 *
 * `next/root-params` hanya bisa dipakai di komponen server, jadi kamusnya
 * dititipkan sekali dari layout dan diambil lewat hook ini — bukan dioper
 * sebagai props dari satu komponen ke komponen berikutnya.
 */
const Konteks = createContext<{ k: Kamus; bahasa: Bahasa } | null>(null);

export function KamusProvider({
  kamus,
  bahasa,
  children,
}: {
  kamus: Kamus;
  bahasa: Bahasa;
  children: ReactNode;
}) {
  return <Konteks.Provider value={{ k: kamus, bahasa }}>{children}</Konteks.Provider>;
}

export function useKamus(): { k: Kamus; bahasa: Bahasa } {
  const nilai = useContext(Konteks);
  if (!nilai) throw new Error("useKamus dipakai di luar KamusProvider");
  return nilai;
}
