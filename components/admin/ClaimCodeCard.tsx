"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ActionButton } from "@/components/admin/ActionButton";
import { CopyIcon, WhatsAppIcon } from "@/components/icons";
import { Badge, Button, buttonClass, labelClass } from "@/components/ui";
import { copyText } from "@/lib/client/clipboard";
import { waClaimCodeMessage, waTo } from "@/lib/links";
import type { AdminActionState } from "@/lib/public-types";
import { formatWaNumber } from "@/lib/wa-number";

export interface ClaimCodeCardProps {
  orderNo: string;
  claimCode: string | null;
  claimExpiresLabel: string | null;
  /** The customer account that has already claimed this order. */
  customer: { nama: string; waNumber: string; claimedLabel: string } | null;
  /** The buyer's WhatsApp number recorded by the admin on the order. */
  orderWaNumber: string | null;
  generateAction: () => Promise<AdminActionState>;
  revokeAction: () => Promise<AdminActionState>;
  detachAction: () => Promise<AdminActionState>;
}

export function ClaimCodeCard(props: ClaimCodeCardProps) {
  const { orderNo, claimCode, claimExpiresLabel, customer, orderWaNumber } = props;
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function salin(text: string, label: string) {
    const ok = await copyText(text);
    if (ok) toast.success(`${label} copied`);
    else toast.error("Failed to copy.");
  }

  if (customer) {
    return (
      <div className="space-y-3">
        <div className="text-sm">
          <p className="font-medium text-ink">{customer.nama}</p>
          <p className="text-muted">{formatWaNumber(customer.waNumber)}</p>
          <p className="mt-1 text-xs text-muted">Claimed {customer.claimedLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={waTo(customer.waNumber, `Hi ${customer.nama}, regarding order ${orderNo}:`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("secondary", "sm")}
          >
            <WhatsAppIcon className="size-4" /> Chat customer
          </a>
          <ActionButton
            action={props.detachAction}
            variant="dangerSoft"
            size="sm"
            confirm="Release this order from the customer account? After that the order can be claimed again with a new code."
          >
            Release from account
          </ActionButton>
        </div>
      </div>
    );
  }

  if (!claimCode) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">
          This order isn't in any customer account yet. Create a claim code, then send it to the buyer via WhatsApp.
        </p>
        <ActionButton action={props.generateAction} variant="primary" size="sm">
          Create claim code
        </ActionButton>
      </div>
    );
  }

  const pesan = waClaimCodeMessage(orderNo, claimCode, `${origin}/account/register`);

  return (
    <div className="space-y-4">
      <div>
        <p className={labelClass}>Claim code</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <code className="flex-1 rounded-2xl border-2 border-ink bg-paper px-3.5 py-2.5 text-center font-mono text-lg font-bold tracking-widest">
            {claimCode}
          </code>
          <Button variant="secondary" onClick={() => salin(claimCode, "Claim code")}>
            <CopyIcon className="size-4" /> Copy
          </Button>
        </div>
        {claimExpiresLabel && (
          <p className="mt-1.5 text-xs text-muted">
            Valid until {claimExpiresLabel} · <Badge tone="yellow">not claimed</Badge>
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {orderWaNumber ? (
          <a
            href={waTo(orderWaNumber, pesan)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("primary", "sm")}
          >
            <WhatsAppIcon className="size-4" /> Send to {formatWaNumber(orderWaNumber)}
          </a>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => salin(pesan, "Claim message")}>
            <CopyIcon className="size-4" /> Copy message for customer
          </Button>
        )}
        <ActionButton
          action={props.generateAction}
          size="sm"
          confirm="Create a new code? The current code stops working immediately."
        >
          Regenerate code
        </ActionButton>
        <ActionButton action={props.revokeAction} variant="dangerSoft" size="sm" confirm="Revoke this claim code?">
          Revoke code
        </ActionButton>
      </div>

      {!orderWaNumber && (
        <p className="text-xs text-muted">
          Enter the buyer's WhatsApp number in the “Edit order” form so the code can be sent in one click and
          automatic expiry reminders can run.
        </p>
      )}
    </div>
  );
}
