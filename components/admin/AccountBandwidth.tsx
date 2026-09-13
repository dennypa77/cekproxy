"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client/api";
import { formatGb } from "@/lib/format";
import type { BandwidthResponse } from "@/lib/public-types";

// Batasi request paralel agar tabel besar tidak membanjiri API.
const MAX_CONCURRENT = 3;
let running = 0;
const queue: (() => void)[] = [];

function schedule<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      running++;
      task()
        .then(resolve, reject)
        .finally(() => {
          running--;
          queue.shift()?.();
        });
    };
    if (running < MAX_CONCURRENT) run();
    else queue.push(run);
  });
}

export function AccountBandwidth({ accountId }: { accountId: string }) {
  const [data, setData] = useState<BandwidthResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    void schedule(() => apiFetch<BandwidthResponse>(`/api/admin/akun/${accountId}/bandwidth`)).then((result) => {
      if (cancelled) return;
      setData(result.ok ? result.data : { available: false, message: result.error });
    });
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  if (!data) return <span className="inline-block h-4 w-20 animate-pulse rounded bg-paper" />;
  if (!data.available) {
    return (
      <span className="text-xs text-bad" title={data.message}>
        Tidak tersedia
      </span>
    );
  }
  if (data.unlimited) return <span className="text-xs">{formatGb(data.usedGb)} / Unlimited</span>;

  const percent = data.percent ?? 0;
  const color = percent > 95 ? "text-bad" : percent > 80 ? "text-amber-700" : "text-ink";
  return (
    <span className={`text-xs whitespace-nowrap ${color}`}>
      {formatGb(data.usedGb)} / {formatGb(data.limitGb)} ({percent}%)
    </span>
  );
}
