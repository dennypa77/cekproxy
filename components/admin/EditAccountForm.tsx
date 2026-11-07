"use client";

import { Button, inputClass, labelClass } from "@/components/ui";
import type { AdminActionState } from "@/lib/public-types";
import { ResultDetails } from "@/components/ResultDetails";
import { useServerForm } from "@/components/useServerForm";

export function EditAccountForm({
  action,
  account,
}: {
  action: (formData: FormData) => Promise<AdminActionState>;
  account: {
    label: string;
    email: string | null;
    catatan: string | null;
    maskedKey: string;
    rotating_enabled: boolean;
    rotating_reserve_gb: number | null;
  };
}) {
  const { pending, state, onSubmit } = useServerForm(action);
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="edit-label">
            Label
          </label>
          <input id="edit-label" name="label" required defaultValue={account.label} maxLength={100} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="edit-email">
            Email
          </label>
          <input id="edit-email" name="email" type="email" defaultValue={account.email ?? ""} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="edit-key">
          New API key <span className="font-normal text-muted">(currently {account.maskedKey})</span>
        </label>
        <input
          id="edit-key"
          name="api_key"
          autoComplete="off"
          spellCheck={false}
          placeholder="Leave blank to keep the current one"
          className={`${inputClass} font-mono`}
        />
      </div>
      <div className="rounded-2xl border-2 border-ink bg-brand-softer p-3">
        <label className="flex items-start gap-2 text-sm font-bold text-ink">
          <input
            type="checkbox"
            name="rotating_enabled"
            defaultChecked={account.rotating_enabled}
            className="mt-0.5 size-4 accent-brand-deep"
          />
          Add this account to the rotating pool
        </label>
        <div className="mt-3">
          <label className={labelClass} htmlFor="edit-reserve">
            Bandwidth reserve (GB)
          </label>
          <input
            id="edit-reserve"
            name="rotating_reserve_gb"
            type="number"
            min={0}
            step="0.1"
            defaultValue={account.rotating_reserve_gb ?? ""}
            placeholder="Blank = no reserve"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted">
            GB set aside for the account owner. The account automatically leaves the rotating pool once the remaining
            bandwidth reaches this number.
          </p>
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="edit-note">
          Notes
        </label>
        <textarea id="edit-note" name="catatan" rows={3} defaultValue={account.catatan ?? ""} className={inputClass} />
      </div>
      <Button type="submit" loading={pending}>
        Save
      </Button>
      <ResultDetails state={state} />
    </form>
  );
}
