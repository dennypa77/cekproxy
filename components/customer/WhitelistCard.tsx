"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AlertIcon, LocateIcon, LockIcon, MapPinIcon, RefreshIcon, ShieldIcon, TrashIcon } from "@/components/icons";
import { Button, Card, CardHeader, cn, inputClass, labelClass } from "@/components/ui";
import { apiFetch, orderApi } from "@/lib/client/api";
import { formatDate } from "@/lib/format";
import type { MyIpResponse, WhitelistEntry } from "@/lib/public-types";

const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export function WhitelistCard({ orderNo, expired }: { orderNo: string; expired: boolean }) {
  const [entries, setEntries] = useState<WhitelistEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ip, setIp] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await apiFetch<WhitelistEntry[]>(orderApi(orderNo, "whitelist"));
    setLoading(false);
    if (result.ok) {
      setEntries(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [orderNo]);

  useEffect(() => {
    void load();
  }, [load]);

  async function detectIp() {
    setDetecting(true);
    const result = await apiFetch<MyIpResponse>("/api/my-ip");
    setDetecting(false);
    if (!result.ok || !result.data.ip) {
      toast.error("IP Anda tidak dapat dideteksi. Silakan isi manual.");
      return;
    }
    if (!result.data.isIPv4) {
      toast.warning(
        `IP Anda saat ini IPv6 (${result.data.ip}). Whitelist hanya mendukung IPv4 — cek IPv4 Anda di situs seperti ipv4.icanhazip.com.`,
        { duration: 8000 },
      );
      return;
    }
    setIp(result.data.ip);
    setInputError(null);
    toast.success("IP Anda saat ini sudah diisi");
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = ip.trim();
    if (!IPV4.test(value)) {
      setInputError("Format IP tidak valid. Contoh yang benar: 103.10.20.30");
      return;
    }
    setInputError(null);
    setAdding(true);
    const result = await apiFetch<WhitelistEntry>(orderApi(orderNo, "whitelist"), {
      method: "POST",
      body: JSON.stringify({ ip: value }),
    });
    setAdding(false);
    if (!result.ok) {
      setInputError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success(`IP ${result.data.ip} ditambahkan ke whitelist`);
    setIp("");
    void load();
  }

  async function remove(entry: WhitelistEntry) {
    setDeletingId(entry.id);
    const result = await apiFetch<{ deleted: boolean }>(orderApi(orderNo, `whitelist/${entry.id}`), { method: "DELETE" });
    setDeletingId(null);
    setConfirmId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`IP ${entry.ip} dihapus dari whitelist`);
    setEntries((current) => current?.filter((e) => e.id !== entry.id) ?? null);
  }

  return (
    <Card>
      <CardHeader
        title="IP"
        accent="Whitelist"
        description="Pakai proxy tanpa username & password dari jaringan dengan IP ini."
        icon={<ShieldIcon className="size-5" />}
        action={
          <Button variant="secondary" size="sm" onClick={load} disabled={loading} aria-label="Muat ulang whitelist">
            <RefreshIcon className={cn("size-4", loading && "animate-spin")} />
          </Button>
        }
      />

      {expired && (
        <p className="mb-4 flex items-center gap-2 rounded-2xl border-2 border-ink bg-bad-soft px-4 py-3 text-sm font-semibold">
          <LockIcon className="size-4 shrink-0" /> Pengelolaan IP whitelist dinonaktifkan karena masa aktif sudah berakhir.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={add} className="space-y-3" noValidate>
          <label htmlFor="whitelist-ip" className={labelClass}>
            Tambah IPv4
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="whitelist-ip"
              value={ip}
              onChange={(event) => {
                setIp(event.target.value);
                setInputError(null);
              }}
              placeholder="Contoh: 103.10.20.30"
              inputMode="decimal"
              autoComplete="off"
              disabled={expired || adding}
              className={cn(inputClass, "h-11 font-mono", inputError && "border-bad")}
              aria-invalid={Boolean(inputError)}
            />
            <Button type="submit" loading={adding} disabled={expired} className="sm:w-28">
              Tambah
            </Button>
          </div>
          <Button variant="secondary" size="sm" onClick={detectIp} loading={detecting} disabled={expired} className="w-full sm:w-auto">
            {!detecting && <LocateIcon className="size-4" />} Gunakan IP saya saat ini
          </Button>
          {inputError && (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-bad" role="alert">
              <AlertIcon className="size-4 shrink-0" /> {inputError}
            </p>
          )}
        </form>

        <div>
          <p className={labelClass}>IP terdaftar {entries ? `(${entries.length})` : ""}</p>
          {error && !entries && <p className="rounded-2xl border-2 border-ink bg-bad-soft p-3 text-sm">{error}</p>}
          {!entries && loading && <div className="h-14 animate-pulse rounded-2xl bg-paper" />}
          {entries && entries.length === 0 && (
            <p className="rounded-2xl border-2 border-dashed border-ink/40 bg-paper p-4 text-center text-sm text-muted">
              Belum ada IP di whitelist.
            </p>
          )}
          {entries && entries.length > 0 && (
            <ul className="space-y-2">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-white px-3.5 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep" aria-hidden="true">
                      <MapPinIcon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-ink">{entry.ip}</p>
                      {entry.createdAt && <p className="text-xs text-muted">Ditambahkan {formatDate(entry.createdAt)}</p>}
                    </div>
                  </div>
                  {confirmId === entry.id ? (
                    <div className="flex gap-1.5">
                      <Button variant="ghost" size="xs" onClick={() => setConfirmId(null)} disabled={deletingId === entry.id}>
                        Batal
                      </Button>
                      <Button variant="danger" size="xs" onClick={() => remove(entry)} loading={deletingId === entry.id}>
                        Ya, hapus
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="dangerSoft"
                      size="xs"
                      onClick={() => setConfirmId(entry.id)}
                      disabled={expired}
                      aria-label={`Hapus ${entry.ip}`}
                    >
                      <TrashIcon className="size-3.5" /> Hapus
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
