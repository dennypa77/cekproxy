"use client";

import { useState, useTransition, type FormEvent } from "react";
import { searchOrder, type SearchResult } from "@/app/actions";
import { SearchIcon, StatusIcon } from "@/components/icons";
import { Button, inputClass, labelClass } from "@/components/ui";

export function SearchForm() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<SearchResult["error"] | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const orderNo = value.replace(/\s+/g, "");
    if (!orderNo) {
      setError({ title: "Nomor pesanan wajib diisi", body: "Masukkan nomor pesanan Shopee Anda.", icon: "edit" });
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await searchOrder(orderNo).catch(() => ({
        error: {
          title: "Tidak dapat terhubung",
          body: "Periksa koneksi internet Anda lalu coba lagi.",
          icon: "offline" as const,
        },
      }));
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border-2 border-ink bg-white p-5 sm:p-7" noValidate>
      <label htmlFor="order-no" className={labelClass}>
        Nomor Pesanan Shopee
      </label>
      <input
        id="order-no"
        name="order_no"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Contoh: 240913ABCD1234"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck={false}
        inputMode="text"
        maxLength={60}
        className={`${inputClass} h-14 font-mono text-lg! tracking-wider uppercase`}
      />
      <Button type="submit" size="lg" loading={pending} className="mt-4 w-full">
        {!pending && <SearchIcon className="size-5" />}
        {pending ? "Mengecek…" : "Cek Pesanan"}
      </Button>

      {error && (
        <div className="animate-pop-in mt-5 flex gap-3 rounded-2xl border-2 border-ink bg-warn-soft p-3.5 text-sm text-ink" role="alert">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-white" aria-hidden="true">
            <StatusIcon name={error.icon ?? "alert"} className="size-4" />
          </span>
          <div>
            <p className="font-bold">{error.title}</p>
            {error.body && <p className="mt-0.5 text-muted">{error.body}</p>}
          </div>
        </div>
      )}
    </form>
  );
}
