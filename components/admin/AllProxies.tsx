"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  RefreshIcon,
  SearchIcon,
} from "@/components/icons";
import { Badge, Button, Card, cn, inputClass, labelClass } from "@/components/ui";
import { apiFetch } from "@/lib/client/api";
import { copyText, downloadText } from "@/lib/client/clipboard";
import { countryFlag, countryName } from "@/lib/format";
import { formatProxy, PROXY_FORMATS, type ProxyFormat, type PublicProxy } from "@/lib/public-types";

export interface ProxyAccountInfo {
  id: string;
  label: string;
  email: string | null;
  orderId: string | null;
  orderNo: string | null;
}

type Row = PublicProxy & { accountId: string; accountLabel: string; orderId: string | null; orderNo: string | null };

const PAGE_SIZE = 100;
const CONCURRENCY = 3;
const ALL = "ALL";

export function AllProxies({ accounts }: { accounts: ProxyAccountInfo[] }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [errors, setErrors] = useState<{ label: string; message: string }[]>([]);
  const [done, setDone] = useState(0);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [accountId, setAccountId] = useState(ALL);
  const [country, setCountry] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [format, setFormat] = useState<ProxyFormat>("ip:port:user:pass");
  const [page, setPage] = useState(1);

  const load = useCallback(
    async (fresh: boolean) => {
      setLoading(true);
      setRows([]);
      setErrors([]);
      setDone(0);

      const collected: Row[] = [];
      const failed: { label: string; message: string }[] = [];
      let cursor = 0;

      async function worker() {
        while (cursor < accounts.length) {
          const account = accounts[cursor++];
          const result = await apiFetch<PublicProxy[]>(
            `/api/admin/akun/${account.id}/proxies${fresh ? "?fresh=1" : ""}`,
          );
          if (result.ok) {
            for (const proxy of result.data) {
              collected.push({
                ...proxy,
                accountId: account.id,
                accountLabel: account.label,
                orderId: account.orderId,
                orderNo: account.orderNo,
              });
            }
          } else {
            failed.push({ label: account.label, message: result.error });
          }
          setDone((value) => value + 1);
        }
      }

      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, accounts.length) }, worker));
      collected.sort((a, b) => a.accountLabel.localeCompare(b.accountLabel) || a.ip.localeCompare(b.ip));
      setRows(collected);
      setErrors(failed);
      setLoading(false);
      if (fresh) toast.success(collected.length + " proxy dimuat ulang");
    },
    [accounts],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const countryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const code = row.country ?? "";
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (accountId !== ALL && row.accountId !== accountId) return false;
      if (country !== ALL && (row.country ?? "") !== country) return false;
      if (status === "valid" && !row.valid) return false;
      if (status === "invalid" && row.valid) return false;
      if (!needle) return true;
      return (
        row.ip.includes(needle) ||
        String(row.port).includes(needle) ||
        row.username.toLowerCase().includes(needle) ||
        row.accountLabel.toLowerCase().includes(needle) ||
        (row.orderNo ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q, accountId, country, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const validCount = filtered.filter((row) => row.valid).length;

  function reset(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  async function copyAll() {
    if (!filtered.length) return;
    const ok = await copyText(filtered.map((row) => formatProxy(row, format)).join("\n"));
    if (ok) toast.success(filtered.length + " proxy disalin");
    else toast.error("Gagal menyalin.");
  }

  function downloadTxt() {
    if (!filtered.length) return;
    downloadText("proxy-pool.txt", filtered.map((row) => formatProxy(row, format)).join("\n") + "\n");
    toast.success(filtered.length + " proxy diunduh (.txt)");
  }

  function downloadCsv() {
    if (!filtered.length) return;
    const header = "ip,port,username,password,negara,status,akun,pesanan";
    const lines = filtered.map((row) =>
      [
        row.ip,
        row.port,
        row.username,
        row.password,
        row.country ?? "",
        row.valid ? "valid" : "tidak valid",
        row.accountLabel.replaceAll(",", " "),
        row.orderNo ?? "",
      ].join(","),
    );
    downloadText("proxy-pool.csv", [header, ...lines].join("\n") + "\n");
    toast.success(filtered.length + " baris diunduh (.csv)");
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted">
              {loading
                ? `Memuat ${done} dari ${accounts.length} akun…`
                : `${filtered.length} proxy ditampilkan · ${validCount} valid · dari ${accounts.length} akun`}
            </p>
            {!loading && filtered.length !== rows.length && (
              <p className="text-xs text-muted">Total tanpa filter: {rows.length} proxy</p>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={() => load(true)} disabled={loading}>
            <RefreshIcon className={cn("size-4", loading && "animate-spin")} /> Muat ulang
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className={labelClass} htmlFor="proxy-q">
              Cari
            </label>
            <div className="relative">
              <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input
                id="proxy-q"
                value={q}
                onChange={(event) => reset(setQ)(event.target.value)}
                placeholder="IP, port, username, akun, pesanan"
                className={inputClass + " pl-9"}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="proxy-account">
              Akun
            </label>
            <select
              id="proxy-account"
              value={accountId}
              onChange={(event) => reset(setAccountId)(event.target.value)}
              className={inputClass}
            >
              <option value={ALL}>Semua akun ({accounts.length})</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.label}
                  {account.orderNo ? ` — ${account.orderNo}` : " — belum tertaut"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="proxy-country">
              Negara
            </label>
            <select
              id="proxy-country"
              value={country}
              onChange={(event) => reset(setCountry)(event.target.value)}
              className={inputClass}
            >
              <option value={ALL}>Semua negara</option>
              {countryCounts.map(([code, count]) => (
                <option key={code || "unknown"} value={code}>
                  {countryFlag(code)} {countryName(code)} ({count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="proxy-status">
              Status
            </label>
            <select
              id="proxy-status"
              value={status}
              onChange={(event) => reset(setStatus)(event.target.value)}
              className={inputClass}
            >
              <option value={ALL}>Semua status</option>
              <option value="valid">Valid saja</option>
              <option value="invalid">Tidak valid saja</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className={labelClass} htmlFor="proxy-format">
              Format ekspor
            </label>
            <select
              id="proxy-format"
              value={format}
              onChange={(event) => setFormat(event.target.value as ProxyFormat)}
              className={inputClass + " font-mono sm:w-56"}
            >
              {PROXY_FORMATS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="md" onClick={copyAll} disabled={!filtered.length}>
              <CopyIcon className="size-4" /> Copy
            </Button>
            <Button variant="secondary" size="md" onClick={downloadTxt} disabled={!filtered.length}>
              <DownloadIcon className="size-4" /> .txt
            </Button>
            <Button variant="primary" size="md" onClick={downloadCsv} disabled={!filtered.length}>
              <DownloadIcon className="size-4" /> .csv lengkap
            </Button>
          </div>
        </div>
      </Card>

      {errors.length > 0 && (
        <Card className="bg-bad-soft">
          <p className="flex items-center gap-2 font-bold">
            <AlertIcon className="size-4" /> {errors.length} akun gagal dimuat
          </p>
          <ul className="mt-2 space-y-1 font-mono text-xs break-all">
            {errors.map((error, index) => (
              <li key={index}>
                {error.label} — {error.message}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        {loading && rows.length === 0 && (
          <div className="space-y-2" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-paper" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="rounded-2xl border-2 border-dashed border-ink/40 bg-paper p-6 text-center text-sm text-muted">
            Tidak ada proxy yang cocok dengan filter.
          </p>
        )}

        {filtered.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-2xl border-2 border-ink">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-ink text-xs font-bold tracking-wider text-white uppercase">
                  <tr>
                    <th className="px-3 py-2.5">#</th>
                    <th className="px-3 py-2.5">IP</th>
                    <th className="px-3 py-2.5">Port</th>
                    <th className="px-3 py-2.5">Username</th>
                    <th className="px-3 py-2.5">Password</th>
                    <th className="px-3 py-2.5">Negara</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Akun</th>
                    <th className="px-3 py-2.5">Pesanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pageItems.map((row, index) => (
                    <tr key={row.accountId + row.ip + row.port} className="hover:bg-brand-softer">
                      <td className="px-3 py-2 text-muted tabular-nums">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold">{row.ip}</td>
                      <td className="px-3 py-2 font-mono tabular-nums">{row.port}</td>
                      <td className="px-3 py-2 font-mono">{row.username}</td>
                      <td className="px-3 py-2 font-mono">{row.password}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {countryFlag(row.country)} {countryName(row.country)}
                      </td>
                      <td className="px-3 py-2">
                        {row.valid ? <Badge tone="green">✓ Valid</Badge> : <Badge tone="red">✕ Tidak valid</Badge>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Link href={`/admin/akun/${row.accountId}`} className="text-brand-deep hover:underline">
                          {row.accountLabel}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-mono whitespace-nowrap">
                        {row.orderId && row.orderNo ? (
                          <Link href={`/admin/pesanan/${row.orderId}`} className="text-brand-deep hover:underline">
                            {row.orderNo}
                          </Link>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <nav className="mt-4 flex items-center justify-between gap-2" aria-label="Paginasi proxy">
                <Button variant="secondary" size="sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>
                  <ChevronLeftIcon className="size-4" /> Sebelumnya
                </Button>
                <span className="rounded-full bg-ink px-4 py-1.5 text-sm font-bold text-white">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Berikutnya <ChevronRightIcon className="size-4" />
                </Button>
              </nav>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
