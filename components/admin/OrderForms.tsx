"use client";

import Link from "next/link";
import { useState } from "react";
import { createOrderAction } from "@/app/admin/actions";
import { Button, inputClass, labelClass } from "@/components/ui";
import { jakartaDateInput } from "@/lib/format";
import type { AdminActionState } from "@/lib/public-types";
import { ResultDetails } from "./ResultDetails";
import { useServerForm } from "./useServerForm";

export interface AccountOption {
  id: string;
  label: string;
  email: string | null;
}

function DateWithShortcuts({
  name,
  value,
  onChange,
  shortcuts,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  shortcuts: number[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <input
        id={name}
        name={name}
        type="date"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} w-auto flex-1`}
      />
      {shortcuts.map((days) => (
        <Button key={days} variant="secondary" size="md" onClick={() => onChange(jakartaDateInput(days))}>
          +{days} hari
        </Button>
      ))}
    </div>
  );
}

export function AddOrderForm({ accounts, defaultDate }: { accounts: AccountOption[]; defaultDate: string }) {
  const [date, setDate] = useState(defaultDate);
  const [createdPath, setCreatedPath] = useState<string | null>(null);
  const { pending, state, onSubmit, formRef } = useServerForm(createOrderAction, {
    resetOnSuccess: true,
    onSuccess: (result) => {
      setDate(defaultDate);
      const line = result.details?.find((d) => d.startsWith("Halaman customer: "));
      setCreatedPath(line ? line.replace("Halaman customer: ", "") : null);
    },
  });

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="shopee_order_no">
            Nomor pesanan Shopee
          </label>
          <input
            id="shopee_order_no"
            name="shopee_order_no"
            required
            autoComplete="off"
            className={`${inputClass} font-mono uppercase`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="nama_customer">
            Nama customer (opsional)
          </label>
          <input id="nama_customer" name="nama_customer" maxLength={100} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="account_id">
          Akun ({accounts.length} available)
        </label>
        <select id="account_id" name="account_id" required className={inputClass} defaultValue="">
          <option value="" disabled>
            {accounts.length ? "Pilih akun…" : "Tidak ada akun available"}
          </option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.label}
              {account.email ? ` — ${account.email}` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <div>
          <label className={labelClass} htmlFor="expires_date">
            Tanggal expired (23:59 WIB)
          </label>
          <DateWithShortcuts name="expires_date" value={date} onChange={setDate} shortcuts={[7, 30]} />
        </div>
        <div>
          <label className={labelClass} htmlFor="replace_quota">
            Kuota replace
          </label>
          <input id="replace_quota" name="replace_quota" type="number" min={0} defaultValue={10} required className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="order_catatan">
          Catatan (opsional)
        </label>
        <input id="order_catatan" name="catatan" maxLength={2000} className={inputClass} />
      </div>
      <Button type="submit" loading={pending} disabled={accounts.length === 0}>
        Simpan pesanan
      </Button>
      <ResultDetails state={state} />
      {state?.ok && createdPath && (
        <Link href={createdPath} target="_blank" className="inline-block text-sm text-brand-deep hover:underline">
          Buka halaman customer →
        </Link>
      )}
    </form>
  );
}

export function EditOrderForm({
  action,
  order,
}: {
  action: (formData: FormData) => Promise<AdminActionState>;
  order: {
    shopee_order_no: string;
    nama_customer: string | null;
    expiresDate: string;
    replace_quota: number;
    replace_used: number;
    catatan: string | null;
  };
}) {
  const [date, setDate] = useState(order.expiresDate);
  const { pending, state, onSubmit } = useServerForm(action);

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="edit_order_no">
            Nomor pesanan Shopee
          </label>
          <input
            id="edit_order_no"
            name="shopee_order_no"
            required
            defaultValue={order.shopee_order_no}
            className={`${inputClass} font-mono uppercase`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="edit_nama">
            Nama customer
          </label>
          <input id="edit_nama" name="nama_customer" defaultValue={order.nama_customer ?? ""} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="expires_date">
          Tanggal expired
        </label>
        <DateWithShortcuts name="expires_date" value={date} onChange={setDate} shortcuts={[7, 30]} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="edit_quota">
            Kuota replace
          </label>
          <input
            id="edit_quota"
            name="replace_quota"
            type="number"
            min={0}
            required
            defaultValue={order.replace_quota}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="edit_used">
            Replace terpakai
          </label>
          <input
            id="edit_used"
            name="replace_used"
            type="number"
            min={0}
            required
            defaultValue={order.replace_used}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="edit_catatan">
          Catatan
        </label>
        <textarea id="edit_catatan" name="catatan" rows={4} defaultValue={order.catatan ?? ""} className={inputClass} />
      </div>
      <Button type="submit" loading={pending}>
        Simpan perubahan
      </Button>
      <ResultDetails state={state} />
    </form>
  );
}

export function ExtendOrderForm({ action }: { action: (formData: FormData) => Promise<AdminActionState> }) {
  const [days, setDays] = useState("30");
  const { pending, state, onSubmit, formRef } = useServerForm(action, {
    resetOnSuccess: true,
    onSuccess: () => setDays("30"),
  });

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className={labelClass} htmlFor="extend_days">
          Tambah hari
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="extend_days"
            name="days"
            type="number"
            min={1}
            max={3650}
            required
            value={days}
            onChange={(event) => setDays(event.target.value)}
            className={`${inputClass} w-28`}
          />
          {[7, 30].map((value) => (
            <Button key={value} variant="secondary" onClick={() => setDays(String(value))}>
              {value} hari
            </Button>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">Jika pesanan sudah expired, perpanjangan dihitung dari hari ini.</p>
      </div>
      <div>
        <label className={labelClass} htmlFor="new_order_no">
          Nomor pesanan Shopee baru (opsional)
        </label>
        <input
          id="new_order_no"
          name="new_order_no"
          autoComplete="off"
          placeholder="Kosongkan jika tetap memakai nomor lama"
          className={`${inputClass} font-mono uppercase`}
        />
        <p className="mt-1 text-xs text-muted">Nomor lama otomatis dicatat di kolom catatan.</p>
      </div>
      <Button type="submit" loading={pending}>
        Perpanjang
      </Button>
      <ResultDetails state={state} />
    </form>
  );
}

export function CredentialsForm({ action }: { action: (formData: FormData) => Promise<AdminActionState> }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { pending, state, onSubmit, formRef } = useServerForm(action);

  const random = () => {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const values = new Uint32Array(14);
    crypto.getRandomValues(values);
    return Array.from(values, (n) => chars[n % chars.length]).join("");
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm text-muted">
        Kosongkan salah satu jika tidak ingin diubah. Berlaku untuk semua proxy di akun ini, dan customer wajib
        memperbarui aplikasinya.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="cred_username">
            Username baru
          </label>
          <div className="flex gap-2">
            <input
              id="cred_username"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="off"
              maxLength={32}
              className={`${inputClass} font-mono`}
            />
            <Button variant="secondary" onClick={() => setUsername(random())}>
              Acak
            </Button>
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="cred_password">
            Password baru
          </label>
          <div className="flex gap-2">
            <input
              id="cred_password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="off"
              maxLength={32}
              className={`${inputClass} font-mono`}
            />
            <Button variant="secondary" onClick={() => setPassword(random())}>
              Acak
            </Button>
          </div>
        </div>
      </div>
      <Button type="submit" loading={pending} disabled={!username && !password}>
        Ganti kredensial
      </Button>
      <ResultDetails state={state} />
    </form>
  );
}

export function LinkAccountForm({
  action,
  accounts,
}: {
  action: (formData: FormData) => Promise<AdminActionState>;
  accounts: AccountOption[];
}) {
  const { pending, onSubmit } = useServerForm(action);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <select name="account_id" required defaultValue="" className={inputClass}>
        <option value="" disabled>
          {accounts.length ? "Pilih akun available…" : "Tidak ada akun available"}
        </option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.label}
            {account.email ? ` — ${account.email}` : ""}
          </option>
        ))}
      </select>
      <Button type="submit" loading={pending} disabled={!accounts.length}>
        Tautkan
      </Button>
    </form>
  );
}
