"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import type { AdminActionState } from "@/lib/public-types";

/**
 * Jalankan server action dari form tanpa reset otomatis React 19,
 * sehingga isian tidak hilang ketika validasi gagal.
 */
export function useServerForm(
  action: (formData: FormData) => Promise<AdminActionState>,
  options: { resetOnSuccess?: boolean; onSuccess?: (state: AdminActionState) => void } = {},
) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<AdminActionState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await action(formData);
        if (!result) return; // redirect
        setState(result);
        if (result.ok) {
          toast.success(result.message);
          if (options.resetOnSuccess) formRef.current?.reset();
          options.onSuccess?.(result);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        // redirect() dari server action dilempar sebagai error khusus Next — biarkan lewat.
        if (error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")) {
          throw error;
        }
        toast.error("Terjadi kesalahan. Silakan coba lagi.");
      }
    });
  }

  return { pending, state, onSubmit, formRef };
}
