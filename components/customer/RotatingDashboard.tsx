"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { LogoTab, ServicePill } from "@/components/Brand";
import { Decor } from "@/components/Decor";
import {
  ChevronLeftIcon,
  ClockIcon,
  CopyIcon,
  KeyIcon,
  RefreshIcon,
  ServerIcon,
  UserIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { Badge, Button, buttonClass, Card, CardHeader, cn, Pill } from "@/components/ui";
import { apiFetch } from "@/lib/client/api";
import { copyText } from "@/lib/client/clipboard";
import { countryFlag, countryName, formatTime } from "@/lib/format";
import { waExtendLink, waHelpLink } from "@/lib/links";
import type { RotatingInfo } from "@/lib/public-types";
import { ExpiryBanner } from "./ExpiryBanner";
import { OtherPlansCard } from "./OtherPlansCard";

export const WARNING_DAYS = 3;

export interface RotatingDashboardProps {
  orderNo: string;
  namaCustomer: string | null;
  expiresAtLabel: string;
  expiresDateShort: string;
  graceEndsLabel: string;
  daysLeft: number;
  expired: boolean;
  apiKey: string;
  baseUrl: string;
  ratePerMinute: number;
  poolSize: number;
  countries: { code: string; count: number }[];
  /** Tujuan tombol kembali: "/account" kalau pesanan ini ada di akun customer. */
  backHref?: string;
  backLabel?: string;
}

export function RotatingDashboard(props: RotatingDashboardProps) {
  const {
    orderNo,
    namaCustomer,
    expiresAtLabel,
    expiresDateShort,
    graceEndsLabel,
    daysLeft,
    expired,
    apiKey,
    baseUrl,
    ratePerMinute,
  } = props;

  const [pool, setPool] = useState({ poolSize: props.poolSize, countries: props.countries });
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const expiringSoon = !expired && daysLeft <= WARNING_DAYS;

  const endpoint = `${baseUrl}/api/rotating?key=${apiKey}`;
  const curlExample = `curl "${endpoint}&count=5"`;
  const proxyExample = `curl -x "http://USER:PASS@IP:PORT" https://api.ipify.org`;

  async function copy(text: string, label: string) {
    const ok = await copyText(text);
    if (ok) toast.success(`${label} copied`);
    else toast.error("Failed to copy. Please copy it manually.");
  }

  async function refreshPool() {
    setRefreshing(true);
    const result = await apiFetch<RotatingInfo>(`/api/rotating/info?key=${encodeURIComponent(apiKey)}&fresh=1`);
    setRefreshing(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPool({ poolSize: result.data.poolSize, countries: result.data.countries });
    setUpdatedAt(result.data.updatedAt);
    toast.success("Pool data updated");
  }

  return (
    <main id="top" className="relative mx-auto w-full max-w-5xl px-4 pb-14">
      <Decor />

      <div className="flex items-start justify-between gap-3">
        <Link
          href={props.backHref ?? "/"}
          className="mt-5 inline-flex items-center gap-1 rounded-full border-2 border-ink bg-surface px-3 py-1.5 text-sm font-semibold transition hover:bg-brand-softer"
        >
          <ChevronLeftIcon className="size-4" /> {props.backLabel ?? "Check another order"}
        </Link>
        <LogoTab size="sm" />
      </div>

      <header className="mt-4 mb-6">
        <p className="text-xs font-bold tracking-widest text-muted uppercase">Order number</p>
        <h1 className="font-mono text-2xl font-bold break-all text-brand-deep sm:text-3xl">{orderNo}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill
            icon={<span className={cn("size-2.5 rounded-full", expired ? "bg-bad" : expiringSoon ? "bg-warn" : "bg-ok")} />}
          >
            {expired ? "Expired" : expiringSoon ? "Expiring soon" : "Active"}
          </Pill>
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-brand-soft px-3 py-1 text-xs font-bold">
            <RefreshIcon className="size-3.5" /> Rotating
          </span>
          {namaCustomer && (
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-surface px-3 py-1 text-xs font-bold">
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
            <CardHeader title="Validity" accent="Period" icon={<ClockIcon className="size-5" />} />
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
                  <span className="ml-2 text-lg font-bold uppercase">days left</span>
                </p>
              )}
            </div>
            <p className="mt-4 text-sm text-muted">Valid until</p>
            <p className="font-bold text-ink">{expiresAtLabel}</p>

            <div className="mt-auto pt-5">
              <p className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">Renew</p>
              <a
                href={waExtendLink(orderNo, expiresDateShort)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("primary", "sm", "w-full")}
              >
                <WhatsAppIcon className="size-4" /> Renew now
              </a>
              <p className="mt-1.5 text-center text-xs text-muted">No service fee, same price.</p>
            </div>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader
              title="Proxy"
              accent="Pool"
              description={`${pool.poolSize} active proxies · limit ${ratePerMinute} requests/minute`}
              icon={<ServerIcon className="size-5" />}
              action={
                <Button variant="secondary" size="sm" onClick={refreshPool} loading={refreshing}>
                  {!refreshing && <RefreshIcon className="size-4" />}
                  <span className="hidden sm:inline">Reload</span>
                </Button>
              }
            />
            <div className="rounded-2xl border-2 border-ink bg-brand-softer p-4 text-center">
              <p className="font-display text-5xl font-extrabold text-ink">{pool.poolSize}</p>
              <p className="text-sm text-muted">proxies ready to use</p>
            </div>

            <p className="mt-4 mb-2 text-xs font-bold tracking-wider text-muted uppercase">Available countries</p>
            {pool.countries.length === 0 ? (
              <p className="rounded-2xl border-2 border-dashed border-ink/40 bg-paper p-3 text-center text-sm text-muted">
                No country data yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {pool.countries.map((country) => (
                  <Badge key={country.code} tone="blue">
                    {countryFlag(country.code)} {countryName(country.code)}: {country.count}
                  </Badge>
                ))}
              </div>
            )}
            {updatedAt && <p className="mt-3 text-xs text-muted">Updated {formatTime(updatedAt)}</p>}
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Endpoint &"
            accent="API Key"
            description="Call this address to get a random proxy from the pool."
            icon={<KeyIcon className="size-5" />}
          />

          {expired && (
            <p className="mb-4 rounded-2xl border-2 border-ink bg-bad-soft px-4 py-3 text-sm font-semibold">
              The API key is disabled because the plan has expired. Renew to activate it again.
            </p>
          )}

          <div className={cn("space-y-4", expired && "pointer-events-none opacity-50 blur-[2px] select-none")}>
            <div>
              <p className="mb-1.5 text-xs font-bold tracking-wider text-muted uppercase">API key (secret)</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <code className="flex-1 rounded-2xl border-2 border-ink bg-paper px-3.5 py-2.5 font-mono text-sm break-all">
                  {apiKey}
                </code>
                <Button variant="secondary" onClick={() => copy(apiKey, "API key")}>
                  <CopyIcon className="size-4" /> Copy
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-bold tracking-wider text-muted uppercase">Endpoint address</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <code className="flex-1 rounded-2xl border-2 border-ink bg-paper px-3.5 py-2.5 font-mono text-sm break-all">
                  {endpoint}
                </code>
                <Button variant="primary" onClick={() => copy(endpoint, "Endpoint address")}>
                  <CopyIcon className="size-4" /> Copy
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-bold tracking-wider text-muted uppercase">Usage example</p>
              <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <code className="flex-1 rounded-2xl border-2 border-line bg-surface-2 px-3.5 py-2.5 font-mono text-xs break-all text-ink">
                    {curlExample}
                  </code>
                  <Button variant="secondary" onClick={() => copy(curlExample, "Example command")}>
                    <CopyIcon className="size-4" /> Copy
                  </Button>
                </div>
                <p className="text-xs text-muted">
                  The response is plain text, one proxy per line. Use those proxies as usual:
                </p>
                <code className="block rounded-2xl border-2 border-line bg-paper px-3.5 py-2.5 font-mono text-xs break-all text-muted">
                  {proxyExample}
                </code>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">Parameter options</p>
              <div className="overflow-x-auto rounded-2xl border-2 border-ink">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-ink text-xs font-bold tracking-wider text-paper uppercase">
                    <tr>
                      <th className="px-3 py-2.5">Parameter</th>
                      <th className="px-3 py-2.5">Value</th>
                      <th className="px-3 py-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    <tr>
                      <td className="px-3 py-2 font-mono">count</td>
                      <td className="px-3 py-2 font-mono">1–50</td>
                      <td className="px-3 py-2">Number of proxies per request. Default 1.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono">country</td>
                      <td className="px-3 py-2 font-mono">US, SG, ID…</td>
                      <td className="px-3 py-2">Pick a specific country. Leave empty for random.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono">format</td>
                      <td className="px-3 py-2 font-mono">ip:port:user:pass, user:pass@ip:port, ip:port, json</td>
                      <td className="px-3 py-2">Output format. Default ip:port:user:pass.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="rounded-2xl border-2 border-ink bg-warn-soft px-4 py-3 text-sm">
              <b>Keep your API key secret.</b> Anyone who has it can use your quota. If it leaks, contact the admin to
              request a new key.
            </p>
          </div>
        </Card>

        <OtherPlansCard />

        <div className="flex flex-col items-center gap-3 pt-4">
          <a href={waHelpLink(orderNo)} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
            <WhatsAppIcon className="size-4" /> Need help? Chat with the admin
          </a>
          <ServicePill />
        </div>
      </div>
    </main>
  );
}
