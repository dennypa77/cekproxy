"use client";

import { Button, inputClass, labelClass } from "@/components/ui";
import type { AdminActionState } from "@/lib/public-types";
import { ResultDetails } from "./ResultDetails";
import { useServerForm } from "./useServerForm";

export function EditAccountForm({
  action,
  account,
}: {
  action: (formData: FormData) => Promise<AdminActionState>;
  account: { label: string; email: string | null; catatan: string | null; maskedKey: string };
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
          API key baru <span className="font-normal text-muted">(saat ini {account.maskedKey})</span>
        </label>
        <input
          id="edit-key"
          name="api_key"
          autoComplete="off"
          spellCheck={false}
          placeholder="Kosongkan jika tidak diganti"
          className={`${inputClass} font-mono`}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="edit-note">
          Catatan
        </label>
        <textarea id="edit-note" name="catatan" rows={3} defaultValue={account.catatan ?? ""} className={inputClass} />
      </div>
      <Button type="submit" loading={pending}>
        Simpan
      </Button>
      <ResultDetails state={state} />
    </form>
  );
}
