import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/customer/account/AccountShell";
import { RegisterForm } from "@/components/customer/account/AccountForms";
import { Card } from "@/components/ui";
import { getCustomer } from "@/lib/customer-session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Daftar Akun" };

export default async function DaftarPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCustomer()) redirect(next && next.startsWith("/") ? next : "/akun");

  return (
    <AccountShell>
      <Card>
        <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight text-ink uppercase">
          Buat <span className="text-brand">akun</span>
        </h1>
        <p className="mt-2 mb-5 text-sm text-muted">
          Satu akun untuk semua pesanan Anda. Nomor WhatsApp dipakai untuk masuk dan untuk kami hubungi kalau pesanan
          mendekati masa berakhir.
        </p>
        <RegisterForm next={next} />
      </Card>
    </AccountShell>
  );
}
