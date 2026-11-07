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
      setError({ title: "Order number is required", body: "Enter your order number.", icon: "edit" });
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await searchOrder(orderNo).catch(() => ({
        error: {
          title: "Can't connect",
          body: "Check your internet connection and try again.",
          icon: "offline" as const,
        },
      }));
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border-2 border-ink bg-surface p-5 sm:p-7" noValidate>
      <label htmlFor="order-no" className={labelClass}>
        Order number
      </label>
      <input
        id="order-no"
        name="order_no"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="e.g. 240913ABCD1234"
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
        {pending ? "Checking…" : "Check order"}
      </Button>

      {error && (
        <div className="animate-pop-in mt-5 flex gap-3 rounded-2xl border-2 border-ink bg-warn-soft p-3.5 text-sm text-ink" role="alert">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-paper" aria-hidden="true">
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
