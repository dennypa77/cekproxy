import "server-only";
import { cacheKeys, invalidate } from "../cache";
import { customerErrorMessage } from "../customer-errors";
import { db, type Order, type WebshareAccount } from "../db";
import { countryName } from "../format";
import {
  createReplacement,
  getReplacement,
  replacementOutcome,
  waitForReplacement,
  WebshareError,
  type ReplacementJob,
} from "../webshare";
import type { CustomerContext } from "./customer";
import { getCountries, getProxies } from "./proxy-data";

/** Kunci proses replace per pesanan (lebih lama dari batas polling + overhead). */
const REPLACE_LOCK_SECONDS = 90;
/**
 * Batas polling agar tidak melewati timeout serverless function.
 * Netlify memotong function sinkron di 60 detik (tidak bisa diubah), sama
 * dengan maxDuration route ini. 25 detik menyisakan banyak ruang.
 */
const POLL_TIMEOUT_MS = 25_000;
const POLL_INTERVAL_MS = 2_000;
/** Replace 'pending' yang tidak kunjung selesai dianggap gagal setelah ini. */
const PENDING_GIVE_UP_MS = 2 * 60 * 60 * 1000;
const REPLACE_FAILED_MESSAGE =
  "Could not replace the IP. Your quota was not used. Please try again or choose another country.";

export type ReplaceResult =
  | { status: "success" | "pending"; message: string; order: Order }
  | { status: "failed"; message: string; httpStatus: number };

function rawError(error: unknown): string {
  if (error instanceof WebshareError) return `[${error.kind}] ${error.message}`;
  return error instanceof Error ? error.message : String(error);
}

function jobError(job: ReplacementJob): string {
  return `state=${job.state} error_code=${job.error_code ?? "-"} error=${job.error ?? "-"} removed=${job.proxies_removed ?? "-"}`;
}

export async function performReplace(
  ctx: CustomerContext & { account: WebshareAccount },
  ip: string,
  country: string,
): Promise<ReplaceResult> {
  const repo = db();
  const { order, account } = ctx;

  await reconcilePendingReplaces(order, account).catch((error) => console.error("[replace] rekonsiliasi gagal", error));

  const log = (status: "success" | "failed" | "pending", error: string | null, replacementId: number | null = null) =>
    repo.insertReplaceLog({
      order_id: order.id,
      old_ip: ip,
      new_country: country,
      status,
      error,
      replacement_id: replacementId,
    });

  // 1) Pastikan IP memang milik pesanan ini (hindari membuang kuota).
  try {
    let proxies = await getProxies(account);
    if (!proxies.some((p) => p.proxy_address === ip)) proxies = await getProxies(account, { fresh: true });
    if (!proxies.some((p) => p.proxy_address === ip)) {
      await log("failed", "IP tidak ada di daftar proxy pesanan");
      return {
        status: "failed",
        httpStatus: 400,
        message: "That IP is not in your proxy list. Reload the proxy list and try again.",
      };
    }
  } catch (error) {
    await log("failed", `Gagal memuat daftar proxy: ${rawError(error)}`);
    return { status: "failed", httpStatus: 502, message: customerErrorMessage(error, "replace") };
  }

  // 2) Validasi negara tujuan.
  if (country !== "ANY") {
    try {
      const countries = await getCountries(account);
      if (!(countries[country] > 0)) {
        await log("failed", `Negara ${country} tidak tersedia`);
        return {
          status: "failed",
          httpStatus: 400,
          message: `No IPs available for ${countryName(country)} right now. Choose another country or Random.`,
        };
      }
    } catch (error) {
      await log("failed", `Gagal memuat negara: ${rawError(error)}`);
      return { status: "failed", httpStatus: 502, message: customerErrorMessage(error, "countries") };
    }
  }

  // 3) Naikkan counter secara atomik SEBELUM memanggil API (anti double click / race).
  const started = await repo.tryStartReplace(order.id, REPLACE_LOCK_SECONDS);
  if (!started) {
    const fresh = await repo.getOrder(order.id);
    if (fresh && fresh.replace_used >= fresh.replace_quota) {
      return { status: "failed", httpStatus: 409, message: "Your replace quota is used up. Contact us on WhatsApp." };
    }
    if (fresh?.replace_lock_until && new Date(fresh.replace_lock_until).getTime() > Date.now()) {
      return {
        status: "failed",
        httpStatus: 409,
        message: "A replace is still in progress. Please wait a moment and try again.",
      };
    }
    return { status: "failed", httpStatus: 403, message: "Replace is not available for this order." };
  }

  // 4) Buat permintaan replace (async v3).
  let job: ReplacementJob;
  try {
    job = await createReplacement(account.api_key, ip, country === "ANY" ? { type: "any" } : { type: "country", country_code: country });
  } catch (error) {
    await repo.releaseReplaceLock(order.id, true);
    await log("failed", rawError(error));
    return { status: "failed", httpStatus: 502, message: customerErrorMessage(error, "replace") };
  }

  const pendingLog = await log("pending", null, job.id);

  // 5) Poll sampai selesai / gagal / batas waktu.
  let finalJob = job;
  try {
    finalJob = await waitForReplacement(account.api_key, job, { timeoutMs: POLL_TIMEOUT_MS, intervalMs: POLL_INTERVAL_MS });
  } catch (error) {
    console.error("[replace] polling error, status dibiarkan pending", error);
  }

  const outcome = replacementOutcome(finalJob);
  await invalidate(cacheKeys.proxies(account.id));

  if (outcome === "success") {
    await repo.resolvePendingLog(pendingLog.id, "success", null);
    await repo.releaseReplaceLock(order.id, false);
    return { status: "success", message: "IP replaced successfully.", order: (await repo.getOrder(order.id)) ?? order };
  }

  if (outcome === "failed") {
    const claimed = await repo.resolvePendingLog(pendingLog.id, "failed", jobError(finalJob));
    await repo.releaseReplaceLock(order.id, claimed);
    return { status: "failed", httpStatus: 502, message: REPLACE_FAILED_MESSAGE };
  }

  // Masih diproses: kuota tetap terpakai sementara; direkonsiliasi saat halaman dibuka lagi.
  await repo.releaseReplaceLock(order.id, false);
  return {
    status: "pending",
    message: "Replace is still processing. Your proxy list will update in 1-2 minutes.",
    order: (await repo.getOrder(order.id)) ?? order,
  };
}

/**
 * Selesaikan log replace berstatus 'pending' (mis. polling sempat timeout).
 * Jika ternyata gagal, kuota dikembalikan. Mengembalikan jumlah yang masih pending.
 */
export async function reconcilePendingReplaces(order: Order, account: WebshareAccount): Promise<number> {
  const repo = db();
  const pending = await repo.listPendingReplaceLogs(order.id);
  let stillPending = 0;
  let changed = false;

  for (const entry of pending) {
    const age = Date.now() - new Date(entry.created_at).getTime();
    const giveUp = async (reason: string) => {
      if (await repo.resolvePendingLog(entry.id, "failed", reason)) await repo.decrementReplaceUsed(order.id);
      changed = true;
    };

    if (!entry.replacement_id) {
      if (age > 10 * 60 * 1000) await giveUp("Tidak ada ID replacement");
      else stillPending++;
      continue;
    }

    try {
      const job = await getReplacement(account.api_key, entry.replacement_id);
      const outcome = replacementOutcome(job);
      if (outcome === "success") {
        await repo.resolvePendingLog(entry.id, "success", null);
        changed = true;
      } else if (outcome === "failed") {
        await giveUp(jobError(job));
      } else if (age > PENDING_GIVE_UP_MS) {
        await giveUp(`Tidak selesai setelah 2 jam (${jobError(job)})`);
      } else {
        stillPending++;
      }
    } catch (error) {
      if (error instanceof WebshareError && error.kind === "not_found") await giveUp(rawError(error));
      else stillPending++;
    }
  }

  if (changed) await invalidate(cacheKeys.proxies(account.id));
  return stillPending;
}
