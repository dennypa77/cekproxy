import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/components/customer/account/AccountShell";
import { ClaimForm } from "@/components/customer/account/AccountForms";
import { WhatsAppIcon } from "@/components/icons";
import { buttonClass, Card } from "@/components/ui";
import { requireCustomer } from "@/lib/customer-session";
import { waHelpLink } from "@/lib/links";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Klaim Pesanan" };

export default async function KlaimPage({ searchParams }: { searchParams: Promise<{ pesanan?: string }> }) {
  const customer = await requireCustomer("/akun/klaim");
  const { pesanan } = await searchParams;

  return (
    <AccountShell nama={customer.nama}>
      <Card>
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">
          Klaim <span className="text-brand">pesanan</span>
        </h2>
        <p className="mt-2 mb-5 text-sm text-muted">
          {pesanan
            ? `Masukkan kode klaim untuk pesanan ${pesanan}. Kodenya dikirim admin lewat WhatsApp.`
            : "Masukkan kode klaim yang dikirim admin lewat WhatsApp. Satu kode untuk satu pesanan."}
        </p>
        <ClaimForm />
      </Card>

      <Card>
        <h3 className="font-display text-base font-extrabold tracking-tight text-ink uppercase">Belum punya kode?</h3>
        <p className="mt-2 text-sm text-muted">
          Minta ke admin lewat WhatsApp dengan menyebutkan nomor pesanan Anda. Kode berlaku 7 hari dan hanya bisa
          dipakai sekali.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={waHelpLink(pesanan)} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md")}>
            <WhatsAppIcon className="size-4" /> Minta kode klaim
          </a>
          <Link href="/akun" className={buttonClass("ghost", "md")}>
            Kembali ke daftar pesanan
          </Link>
        </div>
      </Card>
    </AccountShell>
  );
}
