"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { markFollowUpSentAction } from "@/app/admin/actions";
import { CopyIcon, WhatsAppIcon } from "@/components/icons";
import { Badge, Button, buttonClass } from "@/components/ui";
import { copyText } from "@/lib/client/clipboard";
import { waTo } from "@/lib/links";
import { formatWaNumber } from "@/lib/wa-number";

export interface FollowUpRowData {
  orderId: string;
  orderNo: string;
  template: string;
  alasan: string;
  namaCustomer: string | null;
  waNumber: string | null;
  punyaAkun: boolean;
  expiresLabel: string;
  pesan: string;
  sudahDihubungi: boolean;
}

/** One follow-up row: one-click chat, copy the message, then mark done. */
export function FollowUpRow({ row }: { row: FollowUpRowData }) {
  const [ditandai, setDitandai] = useState(row.sudahDihubungi);
  const [pending, startTransition] = useTransition();

  const salin = async () => {
    const ok = await copyText(row.pesan);
    if (ok) toast.success("Message copied");
    else toast.error("Failed to copy.");
  };

  const tandai = () => {
    startTransition(async () => {
      const hasil = await markFollowUpSentAction(row.orderId, row.template, row.waNumber ?? "-");
      if (hasil.ok) {
        setDitandai(true);
        toast.success(hasil.message);
      } else {
        toast.error(hasil.message);
      }
    });
  };

  return (
    <tr className="align-top">
      <td className="py-2.5 pr-3">
        <p className="font-mono font-medium text-ink">{row.orderNo}</p>
        <p className="text-xs text-muted">{row.namaCustomer ?? "No name"}</p>
      </td>
      <td className="py-2.5 pr-3">
        <Badge tone={row.alasan.startsWith("Expired") ? "red" : row.template === "claim_code" ? "blue" : "yellow"}>
          {row.alasan}
        </Badge>
        <p className="mt-0.5 text-xs text-muted">{row.expiresLabel}</p>
      </td>
      <td className="py-2.5 pr-3">
        {row.waNumber ? (
          <>
            <p className="whitespace-nowrap">{formatWaNumber(row.waNumber)}</p>
            <p className="text-xs text-muted">{row.punyaAkun ? "from customer account" : "recorded on order"}</p>
          </>
        ) : (
          <span className="text-xs text-bad">No number yet</span>
        )}
      </td>
      <td className="py-2.5">
        <div className="flex flex-wrap justify-end gap-1.5">
          {row.waNumber ? (
            <a
              href={waTo(row.waNumber, row.pesan)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("primary", "xs")}
            >
              <WhatsAppIcon className="size-3.5" /> Chat
            </a>
          ) : (
            <span className="text-xs text-muted">Add a number in Edit order</span>
          )}
          <Button variant="secondary" size="xs" onClick={salin}>
            <CopyIcon className="size-3.5" /> Copy message
          </Button>
          {ditandai ? (
            <Badge tone="green">contacted</Badge>
          ) : (
            <Button variant="ghost" size="xs" loading={pending} onClick={tandai}>
              Mark done
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
