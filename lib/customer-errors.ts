import "server-only";
import { WebshareError } from "./webshare-types";

export type CustomerOperation =
  | "bandwidth"
  | "proxies"
  | "countries"
  | "replace"
  | "whitelist_list"
  | "whitelist_add"
  | "whitelist_delete"
  | "credentials";

const DEFAULTS: Record<CustomerOperation, string> = {
  bandwidth: "Bandwidth data is currently unavailable.",
  proxies: "Could not load the proxy list. Please try again in a moment.",
  countries: "Could not load the country list. You can still choose Random.",
  replace: "Could not replace the IP. Your quota was not used. Please try again.",
  whitelist_list: "Could not load the whitelist. Please try again.",
  whitelist_add: "Could not add the IP. Please try again.",
  whitelist_delete: "Could not remove the IP. Please try again.",
  credentials: "Could not change your username & password. Please try again.",
};

/**
 * Ubah error apa pun menjadi pesan bersih untuk customer.
 * Tidak pernah menyertakan nama penyedia, URL API, atau pesan mentah upstream.
 * Error asli dicatat ke log server.
 */
export function customerErrorMessage(error: unknown, operation: CustomerOperation): string {
  console.error(`[customer:${operation}]`, error);

  if (!(error instanceof WebshareError)) return DEFAULTS[operation];

  switch (error.kind) {
    case "auth":
      return "The proxy service for this order is having issues. Please contact us on WhatsApp.";
    case "rate_limited":
      return "The server is busy. Please try again in 1 minute.";
    case "network":
    case "timeout":
    case "upstream":
      return "The proxy server is slow or unreachable. Please try again in a moment.";
    case "bad_request": {
      if (operation === "credentials") {
        const raw = `${error.message} ${JSON.stringify(error.detail ?? "")}`.toLowerCase();
        if (raw.includes("already") || raw.includes("taken") || raw.includes("unique")) {
          return "That username is already taken. Try another one.";
        }
        return "Username/password rejected. Use 8-32 letters and numbers only.";
      }
      if (operation === "whitelist_add") {
        const raw = `${error.message} ${JSON.stringify(error.detail ?? "")}`.toLowerCase();
        if (raw.includes("already") || raw.includes("exist") || raw.includes("unique")) {
          return "This IP is already in the whitelist.";
        }
        if (raw.includes("max") || raw.includes("limit")) {
          return "The whitelist is full. Remove an IP first.";
        }
        return "Could not add the IP. Make sure the IP you entered is correct.";
      }
      return DEFAULTS[operation];
    }
    default:
      return DEFAULTS[operation];
  }
}
