"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertIcon, SwapIcon } from "@/components/icons";
import { Modal } from "@/components/Modal";
import { Button, inputClass, labelClass } from "@/components/ui";
import { apiFetch, orderApi } from "@/lib/client/api";
import { countryFlag, countryName } from "@/lib/format";
import type { CountryOption, PublicProxy, ReplaceResponse } from "@/lib/public-types";

export function ReplaceModal({
  orderNo,
  proxy,
  remaining,
  quota,
  onClose,
  onReplaced,
}: {
  orderNo: string;
  proxy: PublicProxy | null;
  remaining: number;
  quota: number;
  onClose: () => void;
  onReplaced: (result: ReplaceResponse) => void;
}) {
  const [countries, setCountries] = useState<CountryOption[] | null>(null);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [country, setCountry] = useState("ANY");
  const [submitting, setSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const open = proxy !== null;

  useEffect(() => {
    if (!open) return;
    setCountry("ANY");
    setError(null);
    if (countries) return;
    let cancelled = false;
    void apiFetch<CountryOption[]>(orderApi(orderNo, "countries")).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setCountries(result.data);
        setCountriesError(null);
      } else {
        setCountriesError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, orderNo, countries]);

  useEffect(() => {
    if (!submitting) return;
    setElapsed(0);
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [submitting]);

  async function submit() {
    if (!proxy || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await apiFetch<ReplaceResponse>(orderApi(orderNo, "replace"), {
      method: "POST",
      body: JSON.stringify({ ip: proxy.ip, country }),
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    if (result.data.status === "success") toast.success(result.data.message);
    else toast.info(result.data.message);
    onReplaced(result.data);
  }

  const stage = elapsed < 4 ? "Mengirim permintaan…" : elapsed < 15 ? "Mencari IP pengganti…" : "Hampir selesai, mohon tunggu…";
  const sortedCountries = countries
    ? [...countries].sort((a, b) => countryName(a.code).localeCompare(countryName(b.code), "id"))
    : [];

  return (
    <Modal open={open} title="Ganti" accent="IP Proxy" onClose={onClose} dismissible={!submitting}>
      {proxy && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-ink p-4 text-white">
            <p className="text-xs font-bold tracking-wider text-white/60 uppercase">IP yang akan diganti</p>
            <p className="mt-0.5 font-mono text-base font-bold break-all">
              {proxy.ip}:{proxy.port}
            </p>
            <p className="text-xs text-white/70">
              {countryFlag(proxy.country)} {countryName(proxy.country)}
            </p>
          </div>

          <div>
            <label htmlFor="replace-country" className={labelClass}>
              Negara IP baru
            </label>
            <select
              id="replace-country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              disabled={submitting}
              className={`${inputClass} h-12`}
            >
              <option value="ANY">Acak (negara apa saja)</option>
              {sortedCountries.map((option) => (
                <option key={option.code} value={option.code}>
                  {countryFlag(option.code)} {countryName(option.code)}
                </option>
              ))}
            </select>
            {!countries && !countriesError && <p className="mt-1.5 text-xs text-muted">Memuat daftar negara…</p>}
            {countriesError && <p className="mt-1.5 text-xs font-semibold text-ink">{countriesError}</p>}
          </div>

          <ul className="list-disc space-y-1 rounded-2xl border-2 border-line bg-paper py-3 pr-4 pl-8 text-sm text-ink">
            <li>
              Kuota terpakai 1. Sisa setelah ini:{" "}
              <b>
                {Math.max(remaining - 1, 0)} dari {quota}
              </b>
            </li>
            <li>IP lama tidak bisa dipakai lagi setelah diganti.</li>
            <li>Proses bisa sampai ±30 detik. Jangan tutup halaman.</li>
          </ul>

          {submitting && (
            <div className="rounded-2xl border-2 border-ink bg-brand-softer p-3.5 text-sm font-semibold" aria-live="polite">
              <div className="flex items-center justify-between">
                <span>{stage}</span>
                <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-xs text-white">{elapsed} dtk</span>
              </div>
              <div className="mt-2.5 h-2.5 overflow-hidden rounded-full border-2 border-ink bg-white">
                <div className="animate-indeterminate h-full w-2/5 rounded-full bg-brand" />
              </div>
            </div>
          )}

          {error && !submitting && (
            <p className="flex gap-2 rounded-2xl border-2 border-ink bg-bad-soft p-3.5 text-sm font-semibold" role="alert">
              <AlertIcon className="mt-0.5 size-4 shrink-0" /> {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button variant="secondary" size="lg" onClick={onClose} disabled={submitting}>
              Batal
            </Button>
            <Button variant="brand" size="lg" onClick={submit} loading={submitting} disabled={remaining <= 0}>
              {!submitting && <SwapIcon className="size-5" />}
              {submitting ? "Memproses" : "Ganti IP"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
