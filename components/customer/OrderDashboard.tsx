"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { LogoTab, ServicePill } from "@/components/Brand";
import { Decor } from "@/components/Decor";
import { ChevronLeftIcon, ClockIcon, ShopIcon, UserIcon, WhatsAppIcon } from "@/components/icons";
import { buttonClass, Card, CardHeader, cn, Pill } from "@/components/ui";
import { SHOPEE_STORE_URL, waExtendLink, waHelpLink } from "@/lib/links";
import { BandwidthCard } from "./BandwidthCard";
import { ExpiryBanner } from "./ExpiryBanner";
import { ProxySection } from "./ProxySection";
import { WhitelistCard } from "./WhitelistCard";

export interface OrderDashboardProps {
  orderNo: string;
  namaCustomer: string | null;
  expiresAtLabel: string;
  expiresDateShort: string;
  graceEndsLabel: string;
  daysLeft: number;
  expired: boolean;
  initialReplaceUsed: number;
  initialReplaceQuota: number;
}

export const WARNING_DAYS = 3;

export function OrderDashboard(props: OrderDashboardProps) {
  const { orderNo, namaCustomer, expiresAtLabel, expiresDateShort, graceEndsLabel, daysLeft, expired } = props;
  const [quota, setQuota] = useState({ used: props.initialReplaceUsed, total: props.initialReplaceQuota });
  const onQuotaChange = useCallback((used: number, total: number) => setQuota({ used, total }), []);
  const expiringSoon = !expired && daysLeft <= WARNING_DAYS;

  return (
    <main id="top" className="relative mx-auto w-full max-w-5xl px-4 pb-14">
      <Decor />

      <div className="flex items-start justify-between gap-3">
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-3 py-1.5 text-sm font-semibold transition hover:bg-brand-softer"
        >
          <ChevronLeftIcon className="size-4" /> Cek pesanan lain
        </Link>
        <LogoTab size="sm" />
      </div>

      <header className="mt-4 mb-6">
        <p className="text-xs font-bold tracking-widest text-muted uppercase">Nomor pesanan</p>
        <h1 className="font-mono text-2xl font-bold break-all text-brand-deep sm:text-3xl">{orderNo}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill
            icon={
              <span
                className={cn("size-2.5 rounded-full", expired ? "bg-bad" : expiringSoon ? "bg-warn" : "bg-ok")}
              />
            }
          >
            {expired ? "Expired" : expiringSoon ? "Segera expired" : "Aktif"}
          </Pill>
          {namaCustomer && (
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold">
              <UserIcon className="size-3.5" /> {namaCustomer}
            </span>
          )}
        </div>
      </header>

      <div className="space-y-6">
        <ExpiryBanner
          orderNo={orderNo}
          expired={expired}
          daysLeft={daysLeft}
          expiresDateShort={expiresDateShort}
          graceEndsLabel={graceEndsLabel}
          warningDays={WARNING_DAYS}
        />

        <div className="grid gap-6 md:grid-cols-5">
          <Card className="flex flex-col md:col-span-2">
            <CardHeader title="Masa" accent="Aktif" icon={<ClockIcon className="size-5" />} />
            <div
              className={cn(
                "rounded-2xl border-2 border-ink p-4 text-center",
                expired ? "bg-bad-soft" : expiringSoon ? "bg-warn-soft" : "bg-brand-softer",
              )}
            >
              {expired ? (
                <p className="font-display text-3xl font-extrabold uppercase">Expired</p>
              ) : (
                <p className="font-display">
                  <span className="text-6xl leading-none font-extrabold text-ink">{daysLeft}</span>
                  <span className="ml-2 text-lg font-bold uppercase">hari lagi</span>
                </p>
              )}
            </div>
            <p className="mt-4 text-sm text-muted">Berlaku hingga</p>
            <p className="font-bold text-ink">{expiresAtLabel}</p>

            <div className="mt-auto pt-5">
              <p className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">Perpanjang</p>
              <div className="grid grid-cols-2 gap-2">
                <a href={SHOPEE_STORE_URL} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "sm")}>
                  <ShopIcon className="size-4" /> Shopee
                </a>
                <a
                  href={waExtendLink(orderNo, expiresDateShort)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("secondary", "sm")}
                >
                  <WhatsAppIcon className="size-4" /> WhatsApp
                </a>
              </div>
            </div>
          </Card>

          <BandwidthCard orderNo={orderNo} className="md:col-span-3" />
        </div>

        <ProxySection
          orderNo={orderNo}
          expired={expired}
          replaceUsed={quota.used}
          replaceQuota={quota.total}
          onQuotaChange={onQuotaChange}
        />

        <WhitelistCard orderNo={orderNo} expired={expired} />

        <div className="flex flex-col items-center gap-3 pt-4">
          <a href={waHelpLink(orderNo)} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
            <WhatsAppIcon className="size-4" /> Butuh bantuan? Chat admin
          </a>
          <ServicePill />
        </div>
      </div>
    </main>
  );
}
