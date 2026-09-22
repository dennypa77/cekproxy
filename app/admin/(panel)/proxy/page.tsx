import { AllProxies, type ProxyAccountInfo } from "@/components/admin/AllProxies";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Semua Proxy" };
export const dynamic = "force-dynamic";
// Setiap akun diambil daftar proxy-nya lewat API (dimuat bertahap dari browser).
export const maxDuration = 60;

export default async function AllProxiesPage() {
  await requireAdmin();

  const repo = db();
  const [accounts, orders] = await Promise.all([repo.listAccounts(), repo.listOrders()]);
  const orderByAccount = new Map(orders.filter((o) => o.account_id).map((o) => [o.account_id as string, o]));

  // Akun disabled dilewati: API key-nya biasanya sudah tidak berlaku.
  const usable: ProxyAccountInfo[] = accounts
    .filter((account) => account.status !== "disabled")
    .map((account) => {
      const order = orderByAccount.get(account.id);
      return {
        id: account.id,
        label: account.label,
        email: account.email,
        orderId: order?.id ?? null,
        orderNo: order?.shopee_order_no ?? null,
      };
    });

  const disabledCount = accounts.length - usable.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight uppercase">
          Semua <span className="text-brand">Proxy</span>
        </h1>
        <p className="mt-1 text-sm text-muted">
          Gabungan proxy dari seluruh akun di pool, lengkap dengan username, password, negara, dan pesanan pemakainya.
          {disabledCount > 0 && ` ${disabledCount} akun nonaktif tidak ditampilkan.`}
        </p>
      </div>

      {usable.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-ink/40 bg-paper p-6 text-center text-sm text-muted">
          Belum ada akun aktif di pool.
        </p>
      ) : (
        <AllProxies accounts={usable} />
      )}
    </div>
  );
}
