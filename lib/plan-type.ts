/**
 * Penerjemah jenis proxy dari data plan Webshare.
 * - proxy_subtype menentukan jaringannya: residential / isp / datacenter
 * - proxy_type menentukan eksklusivitasnya: dedicated / semidedicated / shared / free
 */

export type ProxyKind = "residential" | "isp" | "datacenter" | "mixed" | "unknown";

export interface PlanFields {
  proxy_type: string | null;
  proxy_subtype: string | null;
  proxy_count?: number | null;
  bandwidth_limit_gb?: number | null;
}

export function proxyKind(subtype: string | null | undefined): ProxyKind {
  switch ((subtype ?? "").toLowerCase()) {
    case "residential":
      return "residential";
    case "isp":
      return "isp";
    case "datacenter_and_isp":
      return "mixed";
    case "default":
    case "premium":
      return "datacenter";
    default:
      return "unknown";
  }
}

export const KIND_LABEL: Record<ProxyKind, string> = {
  residential: "Residential",
  isp: "ISP (Static Residential)",
  datacenter: "Datacenter",
  mixed: "Datacenter + ISP",
  unknown: "Belum diketahui",
};

/** Label pendek untuk kolom tabel / badge. */
export const KIND_SHORT: Record<ProxyKind, string> = {
  residential: "Residential",
  isp: "ISP",
  datacenter: "Datacenter",
  mixed: "DC + ISP",
  unknown: "?",
};

export const KIND_TONE: Record<ProxyKind, "green" | "blue" | "yellow" | "gray"> = {
  residential: "green",
  isp: "blue",
  datacenter: "yellow",
  mixed: "blue",
  unknown: "gray",
};

export function ownershipLabel(type: string | null | undefined): string | null {
  switch ((type ?? "").toLowerCase()) {
    case "dedicated":
      return "Dedicated";
    case "semidedicated":
      return "Semi-dedicated";
    case "shared":
      return "Shared";
    case "free":
      return "Free";
    default:
      return null;
  }
}

/** Contoh hasil: "Residential · Dedicated" atau "Datacenter · Shared". */
export function planLabel(fields: PlanFields | null | undefined): string {
  if (!fields) return KIND_LABEL.unknown;
  const kind = KIND_LABEL[proxyKind(fields.proxy_subtype)];
  const ownership = ownershipLabel(fields.proxy_type);
  return ownership ? `${kind} · ${ownership}` : kind;
}

/** Ringkasan tambahan: "100 proxy · 250 GB". */
export function planDetail(fields: PlanFields | null | undefined): string | null {
  if (!fields) return null;
  const parts: string[] = [];
  if (typeof fields.proxy_count === "number") parts.push(`${fields.proxy_count} proxy`);
  if (typeof fields.bandwidth_limit_gb === "number") {
    parts.push(fields.bandwidth_limit_gb > 0 ? `${fields.bandwidth_limit_gb} GB` : "Unlimited");
  }
  return parts.length ? parts.join(" · ") : null;
}
