"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CopyIcon } from "@/components/icons";
import { Button, inputClass, labelClass } from "@/components/ui";
import { copyText } from "@/lib/client/clipboard";
import type { AdminActionState } from "@/lib/public-types";
import { ActionButton } from "./ActionButton";
import { ResultDetails } from "./ResultDetails";
import { useServerForm } from "./useServerForm";

export function RotatingOrderCard({
  apiKey,
  ratePerMinute,
  regenerateAction,
  limitAction,
}: {
  apiKey: string;
  ratePerMinute: number;
  regenerateAction: () => Promise<AdminActionState>;
  limitAction: (formData: FormData) => Promise<AdminActionState>;
}) {
  const [origin, setOrigin] = useState("");
  const { pending, state, onSubmit } = useServerForm(limitAction);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const endpoint = `${origin}/api/rotating?key=${apiKey}`;

  async function copy(text: string, label: string) {
    const ok = await copyText(text);
    if (ok) toast.success(`${label} disalin`);
    else toast.error("Gagal menyalin.");
  }

  return (
    <div className="space-y-4">
      <div>
        <p className={labelClass}>Kunci API</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <code className="flex-1 rounded-2xl border-2 border-ink bg-paper px-3.5 py-2.5 font-mono text-sm break-all">
            {apiKey}
          </code>
          <Button variant="secondary" onClick={() => copy(apiKey, "Kunci API")}>
            <CopyIcon className="size-4" /> Salin
          </Button>
        </div>
      </div>

      <div>
        <p className={labelClass}>Endpoint customer</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <code className="flex-1 rounded-2xl border-2 border-ink bg-paper px-3.5 py-2.5 font-mono text-xs break-all">
            {endpoint || "memuat…"}
          </code>
          <Button variant="secondary" onClick={() => copy(endpoint, "Endpoint")} disabled={!origin}>
            <CopyIcon className="size-4" /> Salin
          </Button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
        <div>
          <label className={labelClass} htmlFor="rate_per_minute">
            Batas permintaan / menit
          </label>
          <input
            id="rate_per_minute"
            name="rate_per_minute"
            type="number"
            min={1}
            max={100000}
            defaultValue={ratePerMinute}
            required
            className={`${inputClass} w-40`}
          />
        </div>
        <Button type="submit" loading={pending}>
          Simpan batas
        </Button>
      </form>
      <ResultDetails state={state} />

      <div className="border-t border-line pt-3">
        <ActionButton
          action={regenerateAction}
          variant="dangerSoft"
          size="sm"
          confirm="Ganti kunci API? Kunci lama langsung berhenti bekerja dan customer harus memakai kunci baru."
        >
          Ganti kunci API
        </ActionButton>
      </div>
    </div>
  );
}
