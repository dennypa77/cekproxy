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

/** Satu baris follow-up: chat sekali klik, salin pesan, lalu tandai selesai. */
export function FollowUpRow({ row }: { row: FollowUpRowData }) {
  const [ditandai, setDitandai] = useState(row.sudahDihubungi);
  const [pending, startTransition] = useTransition();

  const salin = async () => {
    const ok = await copyText(row.pesan);
    if (ok) toast.success("Pesan disalin");
    else toast.error("Gagal menyalin.");
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
        <p className="text-xs text-muted">{row.namaCustomer ?? "Tanpa nama"}</p>
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
            <p className="text-xs text-muted">{row.punyaAkun ? "dari akun customer" : "dicatat di pesanan"}</p>
          </>
        ) : (
          <span className="text-xs text-bad">Belum ada nomor</span>
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
            <span className="text-xs text-muted">Isi nomor di Edit pesanan</span>
          )}
          <Button variant="secondary" size="xs" onClick={salin}>
            <CopyIcon className="size-3.5" /> Salin pesan
          </Button>
          {ditandai ? (
            <Badge tone="green">sudah dihubungi</Badge>
          ) : (
            <Button variant="ghost" size="xs" loading={pending} onClick={tandai}>
              Tandai sudah
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
