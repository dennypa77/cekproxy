import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/customer/account/AccountShell";
import { RegisterForm } from "@/components/customer/account/AccountForms";
import { Card } from "@/components/ui";
import { getCustomer } from "@/lib/customer-session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create Account" };

export default async function DaftarPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCustomer()) redirect(next && next.startsWith("/") ? next : "/account");

  return (
    <AccountShell>
      <Card>
        <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight text-ink uppercase">
          Create an <span className="text-brand">account</span>
        </h1>
        <p className="mt-2 mb-5 text-sm text-muted">
          One account for all your orders. Your WhatsApp number is used to log in and to reach you when an order is
          close to expiring.
        </p>
        <RegisterForm next={next} />
      </Card>
    </AccountShell>
  );
}
