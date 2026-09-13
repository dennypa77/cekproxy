"use client";

import { useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui";
import type { AdminActionState } from "@/lib/public-types";

export function ActionButton({
  action,
  children,
  confirm,
  variant = "secondary",
  size = "xs",
  disabled,
  title,
}: {
  action: () => Promise<AdminActionState>;
  children: ReactNode;
  confirm?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  title?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={variant}
      size={size}
      loading={pending}
      disabled={disabled}
      title={title}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        startTransition(async () => {
          try {
            const result = await action();
            if (result.ok) toast.success(result.message, { description: result.details?.join("\n") });
            else toast.error(result.message, { description: result.details?.join("\n") });
          } catch {
            toast.error("Terjadi kesalahan. Silakan coba lagi.");
          }
        });
      }}
    >
      {children}
    </Button>
  );
}
