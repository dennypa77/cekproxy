"use client";

import { useEffect, type ReactNode } from "react";
import { XIcon } from "./icons";

export function Modal({
  open,
  title,
  accent,
  onClose,
  dismissible = true,
  children,
}: {
  open: boolean;
  title: string;
  accent?: string;
  onClose: () => void;
  dismissible?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissible) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" onClick={() => dismissible && onClose()} />
      <div className="animate-pop-in relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border-2 border-b-0 border-ink bg-white p-5 sm:max-w-md sm:rounded-3xl sm:border-b-2 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-extrabold tracking-tight uppercase">
            {title} {accent && <span className="text-brand">{accent}</span>}
          </h2>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border-2 border-ink bg-white p-1.5 transition hover:bg-brand-softer"
              aria-label="Tutup"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
