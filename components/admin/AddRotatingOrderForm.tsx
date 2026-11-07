"use client";

import Link from "next/link";
import { useState } from "react";
import { createRotatingOrderAction } from "@/app/admin/actions";
import { Button, inputClass, labelClass } from "@/components/ui";
import { jakartaDateInput } from "@/lib/format";
import { ResultDetails } from "@/components/ResultDetails";
import { useServerForm } from "@/components/useServerForm";

export function AddRotatingOrderForm({ defaultDate }: { defaultDate: string }) {
  const [date, setDate] = useState(defaultDate);
  const [createdPath, setCreatedPath] = useState<string | null>(null);
  const { pending, state, onSubmit, formRef } = useServerForm(createRotatingOrderAction, {
    resetOnSuccess: true,
    onSuccess: (result) => {
      setDate(defaultDate);
      const line = result.details?.find((d) => d.startsWith("Halaman customer: "));
      setCreatedPath(line ? line.replace("Halaman customer: ", "") : null);
    },
  });

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm text-muted">
        A rotating order isn't tied to a single account. The customer gets an API key to pull random proxies from the pool.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="rot_order_no">
            Order number
          </label>
          <input
            id="rot_order_no"
            name="shopee_order_no"
            required
            autoComplete="off"
            className={`${inputClass} font-mono uppercase`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="rot_nama">
            Customer name (optional)
          </label>
          <input id="rot_nama" name="nama_customer" maxLength={100} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="rot_wa">
          Buyer's WhatsApp number (optional)
        </label>
        <input id="rot_wa" name="wa_number" type="tel" inputMode="numeric" placeholder="0812-3456-7890" className={inputClass} />
        <p className="mt-1 text-xs text-muted">Used to send the claim code and reminders before the order expires.</p>
      </div>


      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <div>
          <label className={labelClass} htmlFor="rot_expires_date">
            Expiry date (23:59 WIB)
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="rot_expires_date"
              name="expires_date"
              type="date"
              required
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={`${inputClass} w-auto flex-1`}
            />
            {[7, 30].map((days) => (
              <Button key={days} variant="secondary" onClick={() => setDate(jakartaDateInput(days))}>
                +{days} days
              </Button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="rot_rate">
            Limit / min
          </label>
          <input
            id="rot_rate"
            name="rate_per_minute"
            type="number"
            min={1}
            max={100000}
            defaultValue={60}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="rot_catatan">
          Notes (optional)
        </label>
        <input id="rot_catatan" name="catatan" maxLength={2000} className={inputClass} />
      </div>

      <Button type="submit" loading={pending}>
        Create rotating order
      </Button>
      <ResultDetails state={state} />
      {state?.ok && createdPath && (
        <Link href={createdPath} target="_blank" className="inline-block text-sm text-brand-deep hover:underline">
          Open customer page →
        </Link>
      )}
    </form>
  );
}
