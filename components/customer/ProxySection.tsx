"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  LockIcon,
  RefreshIcon,
  ServerIcon,
  SwapIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { Badge, Button, Card, CardHeader, cn } from "@/components/ui";
import { apiFetch, orderApi } from "@/lib/client/api";
import { copyText, downloadText } from "@/lib/client/clipboard";
import { countryFlag, countryName } from "@/lib/format";
import { waQuotaLink } from "@/lib/links";
import {
  formatProxy,
  PROXY_FORMATS,
  type ProxiesResponse,
  type ProxyFormat,
  type PublicProxy,
  type ReplaceResponse,
} from "@/lib/public-types";
import { ReplaceModal } from "./ReplaceModal";

const PAGE_SIZE = 100;
const FORMAT_STORAGE_KEY = "dm-proxy-format";

export function ProxySection({
  orderNo,
  expired,
  replaceUsed,
  replaceQuota,
  onQuotaChange,
}: {
  orderNo: string;
  expired: boolean;
  replaceUsed: number;
  replaceQuota: number;
  onQuotaChange: (used: number, total: number) => void;
}) {
  const [data, setData] = useState<ProxiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<ProxyFormat>("ip:port:user:pass");
  const [page, setPage] = useState(1);
  const [replaceTarget, setReplaceTarget] = useState<PublicProxy | null>(null);
  const pendingPolls = useRef(0);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(FORMAT_STORAGE_KEY);
      if (saved && (PROXY_FORMATS as readonly string[]).includes(saved)) setFormat(saved as ProxyFormat);
    } catch {
      // abaikan (mode privat)
    }
  }, []);

  const load = useCallback(
    async (fresh = false) => {
      setLoading(true);
      const result = await apiFetch<ProxiesResponse>(orderApi(orderNo, `proxies${fresh ? "?fresh=1" : ""}`));
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setData(result.data);
      onQuotaChange(result.data.replaceUsed, result.data.replaceQuota);
    },
    [orderNo, onQuotaChange],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Jika masih ada replace yang diproses, muat ulang otomatis (maks. 6x, tiap 20 detik).
  useEffect(() => {
    if (!data?.pendingReplace || pendingPolls.current >= 6) return;
    const timer = setTimeout(() => {
      pendingPolls.current += 1;
      void load(true);
    }, 20_000);
    return () => clearTimeout(timer);
  }, [data, load]);

  const proxies = useMemo(() => data?.proxies ?? [], [data]);
  const totalPages = Math.max(1, Math.ceil(proxies.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = proxies.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const remaining = Math.max(replaceQuota - replaceUsed, 0);
  const quotaExhausted = remaining === 0;
  const disabled = expired || !data;
  const validCount = proxies.filter((p) => p.valid).length;

  function changeFormat(next: ProxyFormat) {
    setFormat(next);
    try {
      window.localStorage.setItem(FORMAT_STORAGE_KEY, next);
    } catch {
      // abaikan (mode privat)
    }
  }

  async function copyOne(proxy: PublicProxy) {
    const ok = await copyText(formatProxy(proxy, format));
    if (ok) toast.success("Proxy disalin");
    else toast.error("Gagal menyalin. Silakan salin manual.");
  }

  async function copyAll() {
    if (!proxies.length) return;
    const ok = await copyText(proxies.map((p) => formatProxy(p, format)).join("\n"));
    if (ok) toast.success(`${proxies.length} proxy disalin`);
    else toast.error("Gagal menyalin. Gunakan tombol Download .txt.");
  }

  function download() {
    if (!proxies.length) return;
    downloadText(`proxy-${orderNo}.txt`, proxies.map((p) => formatProxy(p, format)).join("\n") + "\n");
    toast.success("File .txt diunduh");
  }

  function onReplaced(result: ReplaceResponse) {
    onQuotaChange(result.replaceUsed, result.replaceQuota);
    setReplaceTarget(null);
    pendingPolls.current = 0;
    void load(true);
  }

  return (
    <Card>
      <CardHeader
        title="Daftar"
        accent="Proxy"
        description={data ? `${proxies.length} proxy · ${validCount} valid` : "Memuat daftar proxy…"}
        icon={<ServerIcon className="size-5" />}
        action={
          <Button variant="secondary" size="sm" onClick={() => load(true)} disabled={loading} aria-label="Muat ulang daftar proxy">
            <RefreshIcon className={cn("size-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">Muat ulang</span>
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1.5 text-xs font-bold tracking-wider text-muted uppercase">Format</p>
          <div
            role="radiogroup"
            aria-label="Format proxy"
            className="inline-flex flex-wrap gap-1 rounded-2xl border-2 border-ink bg-white p-1 sm:rounded-full"
          >
            {PROXY_FORMATS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={format === option}
                onClick={() => changeFormat(option)}
                className={cn(
                  "rounded-xl px-3 py-1.5 font-mono text-xs font-semibold transition-colors sm:rounded-full",
                  format === option ? "bg-ink text-white" : "text-ink hover:bg-brand-softer",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button variant="secondary" size="sm" onClick={copyAll} disabled={disabled || !proxies.length}>
            <CopyIcon className="size-4" /> Copy semua
          </Button>
          <Button variant="primary" size="sm" onClick={download} disabled={disabled || !proxies.length}>
            <DownloadIcon className="size-4" /> Download .txt
          </Button>
        </div>
      </div>

      {/* Kuota replace */}
      <div
        className={cn(
          "mb-4 flex flex-col gap-3 rounded-2xl border-2 border-ink px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
          quotaExhausted && !expired ? "bg-warn-soft" : "bg-brand-softer",
        )}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-white" aria-hidden="true">
            <SwapIcon className="size-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">
              Sisa replace: {remaining} dari {replaceQuota}
            </p>
            <QuotaDots remaining={remaining} total={replaceQuota} />
          </div>
        </div>
        {quotaExhausted && !expired && (
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            Kuota replace habis, hubungi admin
            <a
              href={waQuotaLink(orderNo)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white"
            >
              <WhatsAppIcon className="size-3.5" /> WhatsApp
            </a>
          </div>
        )}
      </div>

      {data?.pendingReplace && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border-2 border-ink bg-brand-soft px-4 py-3 text-sm font-semibold">
          <RefreshIcon className="size-4 animate-spin" />
          Ada replace IP yang masih diproses. Daftar akan diperbarui otomatis.
        </div>
      )}

      {error && !data && (
        <div className="rounded-2xl border-2 border-ink bg-bad-soft p-4 text-sm">
          <p className="flex items-center gap-2 font-bold">
            <AlertIcon className="size-4" /> {error}
          </p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => load(true)}>
            Coba lagi
          </Button>
        </div>
      )}

      {!data && loading && (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-paper" />
          ))}
        </div>
      )}

      {data && proxies.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-ink/40 bg-paper p-6 text-center text-sm text-muted">
          Belum ada proxy pada pesanan ini.
        </p>
      )}

      {data && proxies.length > 0 && (
        <div className="relative">
          <div className={cn(expired && "pointer-events-none blur-[3px] select-none")} aria-hidden={expired}>
            {/* Mobile: kartu */}
            <ul className="space-y-3 md:hidden">
              {pageItems.map((proxy, index) => (
                <li key={`${proxy.ip}:${proxy.port}`} className="rounded-2xl border-2 border-ink bg-white p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold break-all text-ink">
                        {proxy.ip}:{proxy.port}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        #{(currentPage - 1) * PAGE_SIZE + index + 1} · {countryFlag(proxy.country)} {countryName(proxy.country)}
                      </p>
                    </div>
                    <ValidBadge valid={proxy.valid} />
                  </div>
                  <p className="mt-2 rounded-xl bg-paper px-2.5 py-1.5 font-mono text-xs break-all text-muted">
                    user: <span className="font-semibold text-ink">{proxy.username}</span> · pass:{" "}
                    <span className="font-semibold text-ink">{proxy.password}</span>
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="secondary" size="sm" onClick={() => copyOne(proxy)}>
                      <CopyIcon className="size-4" /> Copy
                    </Button>
                    <Button
                      variant="brand"
                      size="sm"
                      onClick={() => setReplaceTarget(proxy)}
                      disabled={quotaExhausted || data.pendingReplace}
                    >
                      <SwapIcon className="size-4" /> Ganti
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: tabel */}
            <div className="hidden overflow-x-auto rounded-2xl border-2 border-ink md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink text-xs font-bold tracking-wider text-white uppercase">
                  <tr>
                    <th className="px-3 py-2.5">#</th>
                    <th className="px-3 py-2.5">IP</th>
                    <th className="px-3 py-2.5">Port</th>
                    <th className="px-3 py-2.5">Username</th>
                    <th className="px-3 py-2.5">Password</th>
                    <th className="px-3 py-2.5">Negara</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pageItems.map((proxy, index) => (
                    <tr key={`${proxy.ip}:${proxy.port}`} className="transition-colors hover:bg-brand-softer">
                      <td className="px-3 py-2 text-muted tabular-nums">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                      <td className="px-3 py-2 font-mono font-semibold text-ink">{proxy.ip}</td>
                      <td className="px-3 py-2 font-mono tabular-nums">{proxy.port}</td>
                      <td className="px-3 py-2 font-mono">{proxy.username}</td>
                      <td className="px-3 py-2 font-mono">{proxy.password}</td>
                      <td className="px-3 py-2 whitespace-nowrap" title={proxy.country ?? undefined}>
                        {countryFlag(proxy.country)} {countryName(proxy.country)}
                      </td>
                      <td className="px-3 py-2">
                        <ValidBadge valid={proxy.valid} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="xs" onClick={() => copyOne(proxy)} aria-label="Copy proxy">
                            <CopyIcon className="size-3.5" /> Copy
                          </Button>
                          <Button
                            variant="brand"
                            size="xs"
                            onClick={() => setReplaceTarget(proxy)}
                            disabled={quotaExhausted || data.pendingReplace}
                          >
                            <SwapIcon className="size-3.5" /> Ganti
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <nav className="mt-5 flex items-center justify-between gap-2" aria-label="Paginasi proxy">
                <Button variant="secondary" size="sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>
                  <ChevronLeftIcon className="size-4" /> <span className="hidden sm:inline">Sebelumnya</span>
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
                  <span className="hidden sm:inline">Berikutnya</span> <ChevronRightIcon className="size-4" />
                </Button>
              </nav>
            )}
          </div>

          {expired && (
            <div className="absolute inset-0 flex items-start justify-center pt-10">
              <div className="mx-4 max-w-xs rounded-3xl border-2 border-ink bg-white p-5 text-center text-sm">
                <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-ink text-white" aria-hidden="true">
                  <LockIcon className="size-5" />
                </span>
                <p className="mt-3 font-display text-lg font-extrabold uppercase">
                  Proxy <span className="text-bad">tidak aktif</span>
                </p>
                <p className="mt-1 text-muted">Perpanjang pesanan untuk memakai proxy, replace IP, dan whitelist lagi.</p>
                <a
                  href="#top"
                  className="pointer-events-auto mt-3 inline-flex rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-white uppercase"
                >
                  Lihat opsi perpanjang
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      <ReplaceModal
        orderNo={orderNo}
        proxy={replaceTarget}
        remaining={remaining}
        quota={replaceQuota}
        onClose={() => setReplaceTarget(null)}
        onReplaced={onReplaced}
      />
    </Card>
  );
}

function ValidBadge({ valid }: { valid: boolean }) {
  return valid ? <Badge tone="green">✓ Valid</Badge> : <Badge tone="red">✕ Tidak valid</Badge>;
}

/** Titik kuota: terisi = sisa, kosong = terpakai. Teks di atasnya membawa angka yang sama. */
function QuotaDots({ remaining, total }: { remaining: number; total: number }) {
  if (total <= 0 || total > 20) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn("size-3 rounded-full border-2 border-ink", i < remaining ? "bg-brand" : "bg-white")} />
      ))}
    </div>
  );
}
