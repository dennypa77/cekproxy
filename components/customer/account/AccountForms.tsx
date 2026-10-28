"use client";

import Link from "next/link";
import { useState } from "react";
import { claimOrderAction, loginCustomerAction, registerCustomerAction } from "@/app/akun/actions";
import { ResultDetails } from "@/components/ResultDetails";
import { Button, inputClass, labelClass } from "@/components/ui";
import { useServerForm } from "@/components/useServerForm";
import { normalizeClaimCode } from "@/lib/claim-code";

function WaField({ id = "wa_number" }: { id?: string }) {
  return (
    <div>
      <label className={labelClass} htmlFor={id}>
        Nomor WhatsApp
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
      <p className="mt-1 text-xs text-muted">Boleh ditulis 0812…, +62812…, atau 62812… — sama saja.</p>
    </div>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const { pending, state, onSubmit, formRef } = useServerForm(registerCustomerAction);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      <div>
        <label className={labelClass} htmlFor="nama">
          Nama
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
          <p className="mt-1 text-xs text-muted">Minimal 8 karakter.</p>
        </div>
        <div>
          <label className={labelClass} htmlFor="password_konfirmasi">
            Ulangi password
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
        Buat akun
      </Button>
      <ResultDetails state={state} />

      <p className="text-center text-sm text-muted">
        Sudah punya akun?{" "}
        <Link href="/akun/masuk" className="font-semibold text-brand-deep hover:underline">
          Masuk di sini
        </Link>
      </p>
    </form>
  );
}

export function LoginForm({ next }: { next?: string }) {
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
        Masuk
      </Button>
      <ResultDetails state={state} />

      <p className="text-center text-sm text-muted">
        Belum punya akun?{" "}
        <Link href="/akun/daftar" className="font-semibold text-brand-deep hover:underline">
          Daftar dulu
        </Link>
      </p>
      <p className="text-center text-xs text-muted">Lupa password? Hubungi admin lewat WhatsApp.</p>
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
          Kode klaim dari admin
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
          Huruf besar/kecil dan tanda hubung tidak masalah — otomatis dirapikan.
        </p>
      </div>

      <Button type="submit" loading={pending} className="w-full">
        Tambahkan pesanan
      </Button>
      <ResultDetails state={state} />
    </form>
  );
}
