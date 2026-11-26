import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/customer/account/AccountShell";
import { LoginForm } from "@/components/customer/account/AccountForms";
import { Card } from "@/components/ui";
import { getCustomer } from "@/lib/customer-session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Log In" };

export default async function MasukPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCustomer()) redirect(next && next.startsWith("/") ? next : "/account");

  return (
    <AccountShell>
      <Card>
        <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight text-ink uppercase">
          Log in to your <span className="text-brand">account</span>
        </h1>
        <p className="mt-2 mb-5 text-sm text-muted">
          Use the WhatsApp number you registered with to see all your orders in one place.
        </p>
        <LoginForm next={next} />
      </Card>
    </AccountShell>
  );
}
