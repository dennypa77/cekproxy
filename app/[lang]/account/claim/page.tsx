import type { Metadata } from "next";
import { isiVar, jalur } from "@/lib/i18n";
import { bahasaSekarang, kamus } from "@/lib/kamus";
import Link from "next/link";
import { AccountShell } from "@/components/customer/account/AccountShell";
import { ClaimForm } from "@/components/customer/account/AccountForms";
import { WhatsAppIcon } from "@/components/icons";
import { buttonClass, Card } from "@/components/ui";
import { requireCustomer } from "@/lib/customer-session";
import { waHelpLink } from "@/lib/links";

export const dynamic = "force-dynamic";


export default async function KlaimPage({ searchParams }: { searchParams: Promise<{ pesanan?: string }> }) {
  const customer = await requireCustomer("/account/claim");
  const { pesanan } = await searchParams;

  const k = await kamus();
  const bahasa = await bahasaSekarang();
  return (
    <AccountShell nama={customer.nama}>
      <Card>
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink uppercase">
          {k.akun.klaim.judul} <span className="text-brand">{k.akun.klaim.aksen}</span>
        </h2>
        <p className="mt-2 mb-5 text-sm text-muted">
          {pesanan ? isiVar(k.akun.klaim.ringkasDenganNomor, { pesanan }) : k.akun.klaim.ringkas}
        </p>
        <ClaimForm />
      </Card>

      <Card>
        <h3 className="font-display text-base font-extrabold tracking-tight text-ink uppercase">
          {k.akun.klaim.belumPunyaJudul}
        </h3>
        <p className="mt-2 text-sm text-muted">{k.akun.klaim.belumPunyaIsi}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={waHelpLink(pesanan)} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "md")}>
            <WhatsAppIcon className="size-4" /> {k.akun.klaim.mintaKode}
          </a>
          <Link href={jalur(bahasa, "/account")} className={buttonClass("ghost", "md")}>
            {k.akun.klaim.kembaliKePesanan}
          </Link>
        </div>
      </Card>
    </AccountShell>
  );
}

/** Judul tab ikut bahasa; halaman akun memang tidak diindeks. */
export async function generateMetadata(): Promise<Metadata> {
  const k = await kamus();
  return { title: k.akun.klaim.meta };
}
