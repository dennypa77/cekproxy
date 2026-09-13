import { EXPIRED_MESSAGE, jsonError, jsonOk, loadCustomerRoute } from "@/lib/api-route";
import { customerErrorMessage } from "@/lib/customer-errors";
import type { CountryOption } from "@/lib/public-types";
import { getCountries } from "@/lib/services/proxy-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ no: string }> }) {
  const loaded = await loadCustomerRoute(request, (await params).no);
  if (!loaded.ok) return loaded.response;
  if (loaded.ctx.expired) return jsonError(EXPIRED_MESSAGE, 403);

  try {
    const countries = await getCountries(loaded.ctx.account);
    const options: CountryOption[] = Object.entries(countries)
      .map(([code, count]) => ({ code: code.toUpperCase(), count }))
      .sort((a, b) => b.count - a.count);
    return jsonOk(options);
  } catch (error) {
    return jsonError(customerErrorMessage(error, "countries"), 502);
  }
}
