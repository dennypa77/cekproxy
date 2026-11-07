import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/components/customer/account/AccountShell";
import { ClaimForm } from "@/components/customer/account/AccountForms";
import { WhatsAppIcon } from "@/components/icons";
import { buttonClass, Card } from "@/components/ui";
import { requireCustomer } from "@/lib/customer-session";
import { waHelpLink } from "@/lib/links";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Claim Order" };

export default async function KlaimPage({ searchParams }: { searchParams: Promise<{ pesanan?: string }> }) {
  const customer = await requireCustomer("/account/claim");
  const { pesanan } = await searchParams;

  return (
    <AccountShell nama={customer.nama}>
      <Card>
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">
          Claim an <span className="text-brand">order</span>
        </h2>
        <p className="mt-2 mb-5 text-sm text-muted">
          {pesanan
            ? `Enter the claim code for order ${pesanan}. We send the code to you on WhatsApp.`
            : "Enter the claim code we send you on WhatsApp. One code for one order."}
        </p>
        <ClaimForm />
      </Card>

      <Card>
        <h3 className="font-display text-base font-extrabold tracking-tight text-ink uppercase">Don&apos;t have a code?</h3>
        <p className="mt-2 text-sm text-muted">
          Ask us on WhatsApp and include your order number. The code is valid for 7 days and can only be used once.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={waHelpLink(pesanan)} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md")}>
            <WhatsAppIcon className="size-4" /> Request a claim code
          </a>
          <Link href="/account" className={buttonClass("ghost", "md")}>
            Back to my orders
          </Link>
        </div>
      </Card>
    </AccountShell>
  );
}
