"use client";

import Link from "next/link";
import { useState } from "react";
import { claimOrderAction, loginCustomerAction, registerCustomerAction } from "@/app/_actions/account";
import { useKamus } from "@/components/KamusProvider";
import { ResultDetails } from "@/components/ResultDetails";
import { Button, inputClass, labelClass } from "@/components/ui";
import { useServerForm } from "@/components/useServerForm";
import { normalizeClaimCode } from "@/lib/claim-code";

/**
 * Membawa ?next saat pembeli berpindah antara halaman masuk dan daftar.
 * Tanpa ini, orang yang menekan "Buy" pada satu paket lalu memilih "Sign up"
 * akan mendarat di /account dan kehilangan paket yang tadi dipilihnya.
 */
function tautan(path: string, next?: string): string {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}

function WaField({ id = "wa_number" }: { id?: string }) {
  const { k } = useKamus();
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        {k.akun.form.noWa}
      </label>
      <input
        id={id}
        name="wa_number"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        required
        placeholder="0812-3456-7890"
        className={inputClass}
      />
      <p className="mt-1 text-xs text-muted">{k.akun.form.noWaBantuan}</p>
    </div>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const { k } = useKamus();
  const { pending, state, onSubmit, formRef } = useServerForm(registerCustomerAction);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      <div>
        <label className={labelClass} htmlFor="nama">
          Name
        </label>
        <input id="nama" name="nama" required autoComplete="name" maxLength={100} className={inputClass} />
      </div>

      <WaField />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted">{k.akun.form.passwordMinimal}</p>
        </div>
        <div>
          <label className={labelClass} htmlFor="password_konfirmasi">
            Repeat password
          </label>
          <input
            id="password_konfirmasi"
            name="password_konfirmasi"
            type="password"
            required
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
      </div>

      <Button type="submit" loading={pending} className="w-full">
        {k.akun.form.tombolDaftar}
      </Button>
      <ResultDetails state={state} />

      <p className="text-center text-sm text-muted">
        {k.akun.form.sudahPunyaAkun}{" "}
        <Link href={tautan("/account/login", next)} className="font-semibold text-brand-deep hover:underline">
          {k.akun.form.masukDiSini}
        </Link>
      </p>
    </form>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const { k } = useKamus();
  const { pending, state, onSubmit, formRef } = useServerForm(loginCustomerAction);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      <WaField id="login_wa" />

      <div>
        <label className={labelClass} htmlFor="login_password">
          Password
        </label>
        <input
          id="login_password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>

      <Button type="submit" loading={pending} className="w-full">
        {k.akun.form.tombolMasuk}
      </Button>
      <ResultDetails state={state} />

      <p className="text-center text-sm text-muted">
        {k.akun.form.belumPunyaAkun}{" "}
        <Link href={tautan("/account/register", next)} className="font-semibold text-brand-deep hover:underline">
          {k.akun.form.daftarDulu}
        </Link>
      </p>
      <p className="text-center text-xs text-muted">{k.akun.form.lupaPassword}</p>
    </form>
  );
}

export function ClaimForm() {
  const [kode, setKode] = useState("");
  const { pending, state, onSubmit, formRef } = useServerForm(claimOrderAction, {
    onSuccess: () => setKode(""),
  });

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="kode">
          Claim code from the admin
        </label>
        <input
          id="kode"
          name="kode"
          required
          autoComplete="off"
          spellCheck={false}
          placeholder="K7M2P-9XQ4T"
          value={kode}
          onChange={(event) => setKode(normalizeClaimCode(event.target.value))}
          className={`${inputClass} text-center font-mono text-lg tracking-widest uppercase`}
        />
        <p className="mt-1 text-xs text-muted">
          Uppercase/lowercase and dashes don't matter — they're tidied up automatically.
        </p>
      </div>

      <Button type="submit" loading={pending} className="w-full">
        Add order
      </Button>
      <ResultDetails state={state} />
    </form>
  );
}
