"use client";

import { loginAction } from "@/app/admin/actions";
import { Button, inputClass, labelClass } from "@/components/ui";
import { useServerForm } from "./useServerForm";

export function LoginForm() {
  const { pending, onSubmit, state } = useServerForm(loginAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className={labelClass}>
          Password admin
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </div>
      {state && !state.ok && <p className="text-sm text-bad">{state.message}</p>}
      <Button type="submit" size="lg" loading={pending} className="w-full">
        Masuk
      </Button>
    </form>
  );
}
