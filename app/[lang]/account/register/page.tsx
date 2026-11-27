import type { Metadata } from "next";
import { kamus } from "@/lib/kamus";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/customer/account/AccountShell";
import { RegisterForm } from "@/components/customer/account/AccountForms";
import { Card } from "@/components/ui";
import { getCustomer } from "@/lib/customer-session";

export const dynamic = "force-dynamic";


export default async function DaftarPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCustomer()) redirect(next && next.startsWith("/") ? next : "/account");

  const k = await kamus();
  return (
    <AccountShell>
      <Card>
        <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight text-ink uppercase">
          {k.akun.daftar.judul} <span className="text-brand">{k.akun.daftar.aksen}</span>
        </h1>
        <p className="mt-2 mb-5 text-sm text-muted">{k.akun.daftar.ringkas}</p>
        <RegisterForm next={next} />
      </Card>
    </AccountShell>
  );
}

/** Judul tab ikut bahasa; halaman akun memang tidak diindeks. */
export async function generateMetadata(): Promise<Metadata> {
  const k = await kamus();
  return { title: k.akun.daftar.meta };
}
