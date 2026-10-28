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
  /** Akun customer yang sudah mengklaim pesanan ini. */
  customer: { nama: string; waNumber: string; claimedLabel: string } | null;
  /** Nomor WhatsApp pembeli yang dicatat admin di pesanan. */
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
    if (ok) toast.success(`${label} disalin`);
    else toast.error("Gagal menyalin.");
  }

  if (customer) {
    return (
      <div className="space-y-3">
        <div className="text-sm">
          <p className="font-medium text-ink">{customer.nama}</p>
          <p className="text-muted">{formatWaNumber(customer.waNumber)}</p>
          <p className="mt-1 text-xs text-muted">Diklaim {customer.claimedLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={waTo(customer.waNumber, `Halo ${customer.nama}, soal pesanan ${orderNo}:`)}
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
            confirm="Lepas pesanan ini dari akun customer? Setelah itu pesanan bisa diklaim ulang dengan kode baru."
          >
            Lepas dari akun
          </ActionButton>
        </div>
      </div>
    );
  }

  if (!claimCode) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">
          Pesanan ini belum ada di akun customer mana pun. Buat kode klaim, lalu kirimkan ke pembeli lewat WhatsApp.
        </p>
        <ActionButton action={props.generateAction} variant="primary" size="sm">
          Buat kode klaim
        </ActionButton>
      </div>
    );
  }

  const pesan = waClaimCodeMessage(orderNo, claimCode, `${origin}/akun/daftar`);

  return (
    <div className="space-y-4">
      <div>
        <p className={labelClass}>Kode klaim</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <code className="flex-1 rounded-2xl border-2 border-ink bg-paper px-3.5 py-2.5 text-center font-mono text-lg font-bold tracking-widest">
            {claimCode}
          </code>
          <Button variant="secondary" onClick={() => salin(claimCode, "Kode klaim")}>
            <CopyIcon className="size-4" /> Salin
          </Button>
        </div>
        {claimExpiresLabel && (
          <p className="mt-1.5 text-xs text-muted">
            Berlaku sampai {claimExpiresLabel} · <Badge tone="yellow">belum diklaim</Badge>
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
            <WhatsAppIcon className="size-4" /> Kirim ke {formatWaNumber(orderWaNumber)}
          </a>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => salin(pesan, "Pesan klaim")}>
            <CopyIcon className="size-4" /> Salin pesan untuk customer
          </Button>
        )}
        <ActionButton
          action={props.generateAction}
          size="sm"
          confirm="Buat kode baru? Kode yang sekarang langsung tidak berlaku."
        >
          Buat ulang kode
        </ActionButton>
        <ActionButton action={props.revokeAction} variant="dangerSoft" size="sm" confirm="Batalkan kode klaim ini?">
          Batalkan kode
        </ActionButton>
      </div>

      {!orderWaNumber && (
        <p className="text-xs text-muted">
          Isi nomor WhatsApp pembeli di form “Edit pesanan” supaya kode bisa dikirim sekali klik dan pengingat expired
          otomatis bisa jalan.
        </p>
      )}
    </div>
  );
}
