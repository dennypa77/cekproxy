"use client";

import { useState } from "react";
import { approveInvoiceAction, rejectInvoiceAction } from "@/app/admin/actions";
import { ResultDetails } from "@/components/ResultDetails";
import { Button, inputClass, labelClass } from "@/components/ui";
import { useServerForm } from "@/components/useServerForm";
import { jakartaDateInput } from "@/lib/format";
import type { AccountOption } from "./OrderForms";

/**
 * Setujui pembayaran.
 *
 * Dua hal yang tidak memakai pool akun, jadi pilihan akunnya disembunyikan:
 * - perpanjangan: database menambah masa aktif ke pesanan lama;
 * - rotating: pesanannya memakai pool gabungan, tidak menempel ke satu akun.
 */
export function ApproveInvoiceForm({
  invoiceId,
  accounts,
  perpanjangan,
  rotating,
  defaultDate,
  masaAktifHari,
  orderNo,
}: {
  invoiceId: string;
  accounts: AccountOption[];
  perpanjangan: boolean;
  rotating: boolean;
  defaultDate: string;
  masaAktifHari: number;
  orderNo: string | null;
}) {
  const [date, setDate] = useState(defaultDate);
  // Satu-satunya hal yang dibutuhkan formulir: perlu memilih akun atau tidak.
  const tanpaAkun = perpanjangan || rotating;
  const { pending, state, onSubmit, formRef } = useServerForm(
    approveInvoiceAction.bind(null, invoiceId),
  );

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      {tanpaAkun ? (
        <p className="rounded-lg bg-paper p-3 text-sm text-muted">
          {perpanjangan ? (
            <>
              Renewal: {masaAktifHari} days are added to{" "}
              <span className="font-mono font-bold text-ink">{orderNo ?? "the existing order"}</span>.
            </>
          ) : (
            <>
              Rotating plan: the order is created with its own API key and draws from the shared pool for{" "}
              {masaAktifHari} days.
            </>
          )}{" "}
          No account is taken from the pool.
        </p>
      ) : null}

      {!tanpaAkun && (
        <>
          <div>
            <label className={labelClass} htmlFor="account_id">
              Account to hand over
            </label>
            <select id="account_id" name="account_id" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                {accounts.length ? "Select an available account…" : "No available accounts"}
              </option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.label}
                  {account.email ? ` — ${account.email}` : ""}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Pesanan rotating tidak memakai akun, tapi tetap punya masa aktif. */}
      {!perpanjangan && (
        <div>
          <label className={labelClass} htmlFor="expires_date">
            Expires on
          </label>
            <div className="flex flex-wrap gap-2">
              <input
                id="expires_date"
                name="expires_date"
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={`${inputClass} w-auto flex-1`}
              />
              {[masaAktifHari, 7].map((days) => (
                <Button key={days} variant="secondary" size="md" onClick={() => setDate(jakartaDateInput(days))}>
                  +{days} days
                </Button>
              ))}
            </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/*
          Kuota replace hanya relevan untuk pesanan statis baru.
          Field yang disabled TIDAK ikut terkirim, jadi untuk perpanjangan dan
          rotating dipasang input tersembunyi bernilai 0 — tanpa ini validasi
          menolak dengan "Quota must be a number" dan invoice tidak bisa
          disetujui sama sekali.
        */}
        {tanpaAkun ? (
          <input type="hidden" name="replace_quota" value={0} />
        ) : (
          <div>
            <label className={labelClass} htmlFor="replace_quota">
              Replace quota
            </label>
            <input
              id="replace_quota"
              name="replace_quota"
              type="number"
              min={0}
              defaultValue={10}
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label className={labelClass} htmlFor="catatan">
            Internal note
          </label>
          <input id="catatan" name="catatan" maxLength={500} className={inputClass} placeholder="e.g. BCA 14:05" />
        </div>
      </div>

      <p className="text-xs text-muted">The internal note is never shown to the customer.</p>

      <Button type="submit" loading={pending} disabled={!tanpaAkun && accounts.length === 0}>
        Payment received — activate
      </Button>
      <ResultDetails state={state} />
    </form>
  );
}

export function RejectInvoiceForm({ invoiceId }: { invoiceId: string }) {
  const { pending, state, onSubmit, formRef } = useServerForm(rejectInvoiceAction.bind(null, invoiceId));

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className={labelClass} htmlFor="alasan">
          Reason (the customer sees this)
        </label>
        <input
          id="alasan"
          name="alasan"
          required
          maxLength={300}
          className={inputClass}
          placeholder="e.g. no matching transfer found"
        />
      </div>
      <Button type="submit" variant="dangerSoft" loading={pending}>
        Reject invoice
      </Button>
      <ResultDetails state={state} />
    </form>
  );
}
