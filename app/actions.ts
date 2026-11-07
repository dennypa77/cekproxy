"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { devConfigHint } from "@/lib/env";
import { getClientIp } from "@/lib/ip";
import { customerPath } from "@/lib/links";
import { orderNoSchema } from "@/lib/order-no";
import type { StatusIconName } from "@/lib/public-types";
import { hitRateLimit, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { ACCESS_MESSAGES, resolveCustomerOrder } from "@/lib/services/customer";

export interface SearchResult {
  error: { title: string; body: string; icon?: StatusIconName };
}

/** Pencarian nomor pesanan dari halaman utama (10 percobaan/menit per IP). */
export async function searchOrder(rawOrderNo: string): Promise<SearchResult> {
  const ip = getClientIp(await headers());
  if (!(await hitRateLimit("search", ip))) {
    return { error: { title: "Too many attempts", body: RATE_LIMIT_MESSAGE, icon: "slow" } };
  }

  const parsed = orderNoSchema.safeParse(typeof rawOrderNo === "string" ? rawOrderNo : "");
  if (!parsed.success) {
    return { error: { title: "Invalid order number", body: parsed.error.issues[0]?.message ?? "" } };
  }

  let access;
  try {
    access = await resolveCustomerOrder(parsed.data);
  } catch (error) {
    console.error("[search] gagal", error);
    return {
      error: {
        icon: "alert",
        title: "Something went wrong",
        body:
          devConfigHint(error) ?? "The server is having trouble right now. Please try again in a moment.",
      },
    };
  }

  if (!access.ok) return { error: ACCESS_MESSAGES[access.reason] };
  redirect(customerPath(parsed.data));
}
