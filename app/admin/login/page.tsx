import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { LogoTab, ServicePill } from "@/components/Brand";
import { Decor } from "@/components/Decor";
import { getAdminPassword } from "@/lib/env";
import { isAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Login Admin", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-sm flex-col px-4 pb-10">
      <Decor />
      <div className="flex justify-end">
        <LogoTab size="sm" />
      </div>
      <div className="my-auto pt-8">
        <div className="animate-pop-in rounded-3xl border-2 border-ink bg-white p-6">
          <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight uppercase">
            Panel <span className="text-brand">Admin</span>
          </h1>
          <p className="mt-1 mb-6 text-sm text-muted">Cek Proxy DM Digital</p>
          {!getAdminPassword() && (
            <p className="mb-4 rounded-2xl border-2 border-ink bg-warn-soft p-3 text-sm font-semibold">
              ADMIN_PASSWORD belum di-set. Tambahkan di environment variables lalu jalankan ulang.
            </p>
          )}
          <LoginForm />
        </div>
        <div className="mt-8 flex justify-center">
          <ServicePill />
        </div>
      </div>
    </main>
  );
}
