"use client";

import { addAccountAction, bulkImportAccountsAction } from "@/app/admin/actions";
import { Button, inputClass, labelClass } from "@/components/ui";
import type { AdminActionState } from "@/lib/public-types";
import { ResultDetails } from "@/components/ResultDetails";
import { useServerForm } from "@/components/useServerForm";

export function AddAccountForm() {
  const { pending, state, onSubmit, formRef } = useServerForm(addAccountAction, { resetOnSuccess: true });
  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="acc-label">
            Label
          </label>
          <input id="acc-label" name="label" required maxLength={100} placeholder="e.g. Account 01" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="acc-email">
            Email (optional)
          </label>
          <input id="acc-email" name="email" type="email" placeholder="auto-filled from API if empty" className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="acc-key">
          API key
        </label>
        <input id="acc-key" name="api_key" required autoComplete="off" spellCheck={false} className={`${inputClass} font-mono`} />
      </div>
      <div>
        <label className={labelClass} htmlFor="acc-note">
          Notes (optional)
        </label>
        <input id="acc-note" name="catatan" maxLength={1000} className={inputClass} />
      </div>
      <Button type="submit" loading={pending}>
        {pending ? "Validating…" : "Validate & save"}
      </Button>
      <ResultDetails state={state} />
    </form>
  );
}

export function BulkImportForm() {
  const { pending, state, onSubmit, formRef } = useServerForm(bulkImportAccountsAction, {
    onSuccess: (result: AdminActionState) => {
      if (result.details?.every((line) => !line.startsWith("✗"))) formRef.current?.reset();
    },
  });
  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className={labelClass} htmlFor="bulk-keys">
          API keys (one per line, max 30)
        </label>
        <textarea
          id="bulk-keys"
          name="api_keys"
          rows={6}
          required
          spellCheck={false}
          className={`${inputClass} font-mono`}
          placeholder={"key1\nkey2\nkey3"}
        />
      </div>
      <Button type="submit" loading={pending}>
        {pending ? "Importing…" : "Import"}
      </Button>
      <ResultDetails state={state} />
    </form>
  );
}
