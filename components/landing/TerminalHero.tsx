"use client";

import { useEffect, useRef, useState } from "react";

/** Baris yang "diketik" ($) dan baris hasil (→). */
const BARIS: { teks: string; jenis: "perintah" | "hasil" }[] = [
  { teks: "dmproxy status", jenis: "perintah" },
  { teks: "datacenter & residential · multi-country · ready today", jenis: "hasil" },
  { teks: "dmproxy order --plan dc-100ip-250gb", jenis: "perintah" },
  { teks: "100 IP / 250 GB · $7 · active for 30 days", jenis: "hasil" },
  { teks: "dmproxy account --orders all", jenis: "perintah" },
  { teks: "all your orders in one dashboard", jenis: "hasil" },
];

const KECEPATAN_KETIK = 28;
const JEDA_BARIS = 420;

function kurangiGerak(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Jendela terminal yang mengetik sendiri lalu berhenti di hasil akhir.
 * Kalau pengunjung meminta gerakan dikurangi, isinya langsung tampil utuh.
 */
export function TerminalHero() {
  const [tampil, setTampil] = useState<string[]>([]);
  const [selesai, setSelesai] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (kurangiGerak()) {
      setTampil(BARIS.map((b) => b.teks));
      setSelesai(true);
      return;
    }

    let batal = false;
    const jadwal = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!batal) fn();
      }, ms);
      timers.current.push(id);
    };

    const ketikBaris = (indeks: number) => {
      if (indeks >= BARIS.length) {
        setSelesai(true);
        return;
      }
      const { teks, jenis } = BARIS[indeks];
      setTampil((lama) => [...lama, ""]);

      // Baris hasil muncul sekaligus; baris perintah diketik huruf per huruf.
      if (jenis === "hasil") {
        jadwal(() => {
          setTampil((lama) => lama.map((v, i) => (i === indeks ? teks : v)));
          jadwal(() => ketikBaris(indeks + 1), JEDA_BARIS);
        }, 160);
        return;
      }

      let posisi = 0;
      const ketik = () => {
        posisi += 1;
        setTampil((lama) => lama.map((v, i) => (i === indeks ? teks.slice(0, posisi) : v)));
        if (posisi < teks.length) jadwal(ketik, KECEPATAN_KETIK);
        else jadwal(() => ketikBaris(indeks + 1), JEDA_BARIS);
      };
      jadwal(ketik, KECEPATAN_KETIK);
    };

    jadwal(() => ketikBaris(0), 500);
    return () => {
      batal = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-3xl border-2 border-line bg-surface-2/90 font-mono text-sm shadow-[0_0_60px_-20px_var(--color-brand)]"
      aria-hidden="true"
    >
      {/* Bilah judul ala jendela terminal */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-bad/70" />
        <span className="size-2.5 rounded-full bg-warn/70" />
        <span className="size-2.5 rounded-full bg-ok/70" />
        <span className="ml-2 text-xs tracking-wider text-muted">dmproxy — console</span>
      </div>

      <div className="min-h-[13.5rem] space-y-1.5 p-4 sm:min-h-[15rem] sm:p-5">
        {tampil.map((teks, i) => {
          const jenis = BARIS[i]?.jenis ?? "hasil";
          const terakhir = i === tampil.length - 1;
          return (
            <p key={i} className="leading-relaxed break-all">
              {jenis === "perintah" ? (
                <>
                  <span className="text-brand">$</span> <span className="text-ink">{teks}</span>
                </>
              ) : (
                <>
                  <span className="text-ok">→</span> <span className="text-muted">{teks}</span>
                </>
              )}
              {terakhir && !selesai && (
                <span className="ml-0.5 inline-block w-2 animate-caret bg-brand align-middle text-transparent">.</span>
              )}
            </p>
          );
        })}
        {selesai && (
          <p className="pt-1 leading-relaxed">
            <span className="text-brand">$</span>{" "}
            <span className="ml-0.5 inline-block w-2 animate-caret bg-brand align-middle text-transparent">.</span>
          </p>
        )}
      </div>
    </div>
  );
}

/** Latar bergerak: kisi, berkas cahaya, dan titik-titik seperti lampu rak. */
export function DatacenterBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="grid-lines absolute inset-0 animate-grid-drift opacity-70" />
      <div className="absolute inset-x-0 top-0 h-24 animate-scan bg-gradient-to-b from-transparent via-brand/25 to-transparent blur-sm" />
      {[
        "left-[12%] top-[22%]",
        "left-[28%] top-[68%]",
        "left-[62%] top-[18%]",
        "left-[78%] top-[52%]",
        "left-[88%] top-[78%]",
      ].map((posisi, i) => (
        <span
          key={posisi}
          className={`absolute ${posisi} size-1.5 animate-node rounded-full bg-brand`}
          style={{ animationDelay: `${i * 0.45}s` }}
        />
      ))}
    </div>
  );
}
