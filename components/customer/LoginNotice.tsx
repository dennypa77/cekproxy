import Link from "next/link";
import { buttonClass } from "@/components/ui";

/**
 * Ajakan membuat akun di halaman pesanan yang dibuka tanpa akun.
 *
 * Nadanya sengaja ajakan, bukan tenggat. Pesanan lama memang tidak akan
 * pernah terkunci — nomor pesanannya bisa dipakai selamanya — jadi pita ini
 * tidak boleh menakut-nakuti dengan tanggal. Hanya tampil kalau pesanan ini
 * belum masuk akun siapa pun.
 */
export function LoginNotice({ orderNo }: { orderNo: string }) {
  return (
    <div className="border-b-2 border-ink bg-brand-softer">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-snug font-semibold text-ink">
          Order {orderNo} still opens with its order number — nothing changes for you. Create an account to keep all
          your orders on one page, renew in a few clicks, and buy new plans yourself.
        </p>
        <div className="flex shrink-0 gap-2">
          <Link href={`/account/register?next=/orders/${encodeURIComponent(orderNo)}`} className={buttonClass("primary", "sm")}>
            Sign up
          </Link>
          <Link href={`/account/login?next=/orders/${encodeURIComponent(orderNo)}`} className={buttonClass("secondary", "sm")}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
