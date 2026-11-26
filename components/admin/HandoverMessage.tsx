"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CopyIcon } from "@/components/icons";
import { Button, Card } from "@/components/ui";
import { copyText } from "@/lib/client/clipboard";
import { pesanSerahTerima } from "@/lib/links";

/**
 * Pesan siap tempel untuk chat Shopee setelah pesanan selesai disiapkan.
 *
 * Sebelumnya pesan ini diketik ulang setiap kali, dan nomor pesanan maupun
 * tanggal kedaluwarsa rawan salah ketik. Di sini keduanya diambil langsung
 * dari pesanan, jadi tidak mungkin meleset.
 *
 * Teksnya ditampilkan apa adanya supaya bisa diperiksa — dan disunting
 * kalau perlu — sebelum disalin.
 */
export function HandoverMessage({
  host,
  orderNo,
  expiresLabel,
  rotating,
  claimCode,
  claimExpiresLabel,
}: {
  host: string;
  orderNo: string;
  expiresLabel: string;
  rotating: boolean;
  claimCode: string | null;
  claimExpiresLabel: string | null;
}) {
  const [teks, setTeks] = useState(() =>
    pesanSerahTerima({ host, orderNo, expiresLabel, rotating, claimCode, claimExpiresLabel }),
  );

  const asli = pesanSerahTerima({ host, orderNo, expiresLabel, rotating, claimCode, claimExpiresLabel });
  const disunting = teks !== asli;

  async function salin() {
    const ok = await copyText(teks);
    if (ok) toast.success("Message copied — paste it into Shopee chat");
    else toast.error("Failed to copy. Select the text and copy it manually.");
  }

  return (
    <Card>
      <h2 className="mb-1 font-semibold text-ink">Handover message</h2>
      <p className="mb-3 text-sm text-muted">
        Ready to paste into Shopee chat. Addresses are written without{" "}
        <code className="font-mono text-xs">https://</code> because Shopee blocks messages containing full links.
      </p>

      <textarea
        value={teks}
        onChange={(event) => setTeks(event.target.value)}
        rows={14}
        spellCheck={false}
        aria-label="Handover message"
        className="w-full rounded-2xl border-2 border-line bg-paper p-3 font-mono text-xs leading-relaxed text-ink focus:border-brand focus:outline-none"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button onClick={salin} size="sm">
          <CopyIcon className="size-4" /> Copy message
        </Button>
        {disunting && (
          <Button variant="secondary" size="sm" onClick={() => setTeks(asli)}>
            Reset
          </Button>
        )}
        {!claimCode && (
          <span className="text-xs font-semibold text-muted">
            Generate a claim code above to include the account path in this message.
          </span>
        )}
      </div>
    </Card>
  );
}
