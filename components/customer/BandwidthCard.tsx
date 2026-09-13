"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertIcon, CheckIcon, GaugeIcon, RefreshIcon, WifiOffIcon } from "@/components/icons";
import { Button, Card, CardHeader, cn } from "@/components/ui";
import { apiFetch, orderApi } from "@/lib/client/api";
import { formatDate, formatGb, formatTime } from "@/lib/format";
import type { BandwidthResponse } from "@/lib/public-types";

type BandwidthData = Extract<BandwidthResponse, { available: true }>;

/*
 * Meter: warna isi membawa tingkat keparahan (biru → warning → critical),
 * track memakai langkah lebih terang dari hue yang sama. Warna tidak pernah
 * berdiri sendiri: selalu ada outline, ikon, label status, dan angka persen.
 * Warning (#fab219) < 3:1 terhadap putih → label terlihat wajib (sudah ada).
 */
const SEVERITY = {
  normal: { fill: "#1e8bff", track: "#dcebff", Icon: CheckIcon, label: "Aman", chip: "bg-ok-soft" },
  warning: { fill: "#fab219", track: "#fff1c7", Icon: AlertIcon, label: "Hampir habis", chip: "bg-warn-soft" },
  critical: { fill: "#d03b3b", track: "#fbdcdc", Icon: AlertIcon, label: "Kritis", chip: "bg-bad-soft" },
} as const;

function severityOf(percent: number): keyof typeof SEVERITY {
  if (percent > 95) return "critical";
  if (percent > 80) return "warning";
  return "normal";
}

export function BandwidthCard({ orderNo, className }: { orderNo: string; className?: string }) {
  const [data, setData] = useState<BandwidthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (refresh: boolean) => {
      setLoading(true);
      const result = await apiFetch<BandwidthResponse>(orderApi(orderNo, `bandwidth${refresh ? "?refresh=1" : ""}`));
      setLoading(false);
      if (result.ok) {
        setData(result.data);
        if (refresh && result.data.available) toast.success("Data bandwidth diperbarui");
      } else {
        setData({ available: false, message: result.error });
        if (refresh) toast.error(result.error);
      }
    },
    [orderNo],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  return (
    <Card className={className}>
      <CardHeader
        title="Sisa"
        accent="Bandwidth"
        icon={<GaugeIcon className="size-5" />}
        action={
          <Button variant="secondary" size="sm" onClick={() => load(true)} disabled={loading} aria-label="Refresh bandwidth">
            <RefreshIcon className={cn("size-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        }
      />

      {!data && loading && <MeterSkeleton />}

      {data && !data.available && (
        <div className="rounded-2xl border-2 border-dashed border-ink/40 bg-paper p-5 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-ink text-white" aria-hidden="true">
            <WifiOffIcon className="size-5" />
          </span>
          <p className="mt-3 font-bold text-ink">Data bandwidth sedang tidak tersedia</p>
          <p className="mt-0.5 text-sm text-muted">Silakan tekan Refresh beberapa saat lagi.</p>
        </div>
      )}

      {data?.available && (data.unlimited ? <UnlimitedView data={data} /> : <BandwidthMeter data={data} />)}

      {data?.available && (
        <p className="mt-4 text-center text-xs text-muted">
          Periode {formatDate(data.periodStart)} – {formatDate(data.periodEnd)} · Diperbarui {formatTime(data.updatedAt)} WIB
        </p>
      )}
    </Card>
  );
}

// Busur setengah lingkaran: pusat (130,130), jari-jari 110, dalam viewBox 260×156.
const ARC = "M20 130 A110 110 0 0 1 240 130";
const VIEWBOX = "0 0 260 156";

function BandwidthMeter({ data }: { data: BandwidthData }) {
  const rawPercent = data.percent ?? 0;
  const percent = Math.min(Math.max(rawPercent, 0), 100);
  const remainingGb = Math.max(data.limitGb - data.usedGb, 0);
  const severity = SEVERITY[severityOf(rawPercent)];

  // Animasi isi dari 0 saat pertama tampil / saat nilai berubah.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(percent));
    return () => cancelAnimationFrame(frame);
  }, [percent]);

  const [hover, setHover] = useState(false);
  const percentText = `${rawPercent.toLocaleString("id-ID")}%`;
  const summary = `Terpakai ${formatGb(data.usedGb)} (${percentText}) · Sisa ${formatGb(remainingGb)} dari ${formatGb(data.limitGb)}`;

  return (
    <div>
      <div
        className="relative mx-auto w-full max-w-[340px] rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
        tabIndex={0}
        role="img"
        aria-label={summary}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
      >
        <svg viewBox={VIEWBOX} className="w-full overflow-visible" aria-hidden="true">
          {/* outline + track */}
          <path d={ARC} fill="none" stroke="#111111" strokeWidth={28} strokeLinecap="round" />
          <path d={ARC} fill="none" stroke={severity.track} strokeWidth={22} strokeLinecap="round" />
          {/* isi (terpakai) */}
          {shown > 0 && (
            <path
              d={ARC}
              fill="none"
              stroke={severity.fill}
              strokeWidth={22}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${shown} 100`}
              style={{ transition: "stroke-dasharray 900ms cubic-bezier(0.22, 1, 0.36, 1), stroke 300ms" }}
            />
          )}
          {/* kenop penanda posisi pemakaian */}
          <g
            style={{
              transform: `rotate(${shown * 1.8}deg)`,
              transformOrigin: "130px 130px",
              transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <circle cx={20} cy={130} r={10} fill="#ffffff" stroke="#111111" strokeWidth={3} />
          </g>
          {/* label skala di bawah ujung busur */}
          <text x={20} y={155} textAnchor="middle" className="fill-muted text-[10px] font-semibold">
            0
          </text>
          <text x={240} y={155} textAnchor="middle" className="fill-muted text-[10px] font-semibold">
            {formatGb(data.limitGb)}
          </text>
        </svg>

        {/* Teks di tengah, bertumpu pada garis dasar busur (130/156 ≈ 17% dari bawah) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[17%] text-center">
          <p className="text-[11px] font-bold tracking-widest text-muted uppercase">Sisa</p>
          <p className="font-display text-3xl leading-none font-extrabold text-ink sm:text-4xl">{formatGb(remainingGb)}</p>
          <p className="mt-1 text-xs text-muted">dari {formatGb(data.limitGb)}</p>
        </div>

        {hover && (
          <div className="animate-pop-in pointer-events-none absolute -top-3 left-1/2 z-10 w-max max-w-[260px] -translate-x-1/2 rounded-xl bg-ink px-3 py-1.5 text-center text-xs font-semibold text-white">
            {summary}
          </div>
        )}
      </div>

      {/* Ringkasan angka (legend + tabel mini) */}
      <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl border-2 border-ink bg-white px-2 py-2.5">
          <dt className="flex items-center justify-center gap-1.5 text-xs font-bold text-muted">
            <span className="size-3 rounded-full border-2 border-ink" style={{ background: severity.fill }} aria-hidden="true" />
            Terpakai
          </dt>
          <dd className="mt-0.5 text-sm font-extrabold text-ink sm:text-base">{formatGb(data.usedGb)}</dd>
        </div>
        <div className="rounded-2xl border-2 border-ink bg-white px-2 py-2.5">
          <dt className="flex items-center justify-center gap-1.5 text-xs font-bold text-muted">
            <span className="size-3 rounded-full border-2 border-ink" style={{ background: severity.track }} aria-hidden="true" />
            Sisa
          </dt>
          <dd className="mt-0.5 text-sm font-extrabold text-ink sm:text-base">{formatGb(remainingGb)}</dd>
        </div>
        <div className={cn("rounded-2xl border-2 border-ink px-2 py-2.5", severity.chip)}>
          <dt className="flex items-center justify-center gap-1 text-xs font-bold text-ink">
            <severity.Icon className="size-3.5" /> {severity.label}
          </dt>
          <dd className="mt-0.5 text-sm font-extrabold text-ink sm:text-base">{percentText}</dd>
        </div>
      </dl>

      {rawPercent > 95 && (
        <p className="mt-3 flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-bad-soft px-3 py-2 text-center text-sm font-semibold">
          <AlertIcon className="size-4 shrink-0" /> Bandwidth hampir habis. Hubungi admin untuk menambah kuota.
        </p>
      )}
    </div>
  );
}

function UnlimitedView({ data }: { data: BandwidthData }) {
  return (
    <div className="flex flex-col items-center py-2 text-center">
      <span
        className="flex size-24 items-center justify-center rounded-full bg-ink font-display text-6xl leading-none font-extrabold text-brand"
        aria-hidden="true"
      >
        ∞
      </span>
      <p className="mt-4 font-display text-3xl font-extrabold uppercase">
        <span className="text-brand">Unlimited</span>
      </p>
      <p className="mt-1 text-sm text-muted">
        Terpakai <b className="text-ink">{formatGb(data.usedGb)}</b> pada periode ini
      </p>
    </div>
  );
}

function MeterSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Memuat data bandwidth">
      <svg viewBox={VIEWBOX} className="mx-auto w-full max-w-[340px]" aria-hidden="true">
        <path d={ARC} fill="none" stroke="#e3e6eb" strokeWidth={28} strokeLinecap="round" />
      </svg>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-2xl bg-paper" />
        ))}
      </div>
    </div>
  );
}
