export const DAY_MS = 86_400_000;
export const TIME_ZONE = "Asia/Jakarta";

export function formatDateTime(iso: string): string {
  const text = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
  return `${text} WIB`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE }).format(
    new Date(iso),
  );
}

/** Sisa hari dibulatkan ke atas; 0 jika sudah lewat. */
export function daysLeft(expiresAtIso: string, now = Date.now()): number {
  const diff = new Date(expiresAtIso).getTime() - now;
  return diff <= 0 ? 0 : Math.ceil(diff / DAY_MS);
}

/** Tanggal (YYYY-MM-DD) di zona WIB, digeser n hari dari sekarang. */
export function jakartaDateInput(offsetDays = 0, from = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date(from + offsetDays * DAY_MS));
}

/** "YYYY-MM-DD" → ISO pukul 23:59:59 WIB hari itu. */
export function endOfJakartaDay(dateInput: string): string {
  return new Date(`${dateInput}T23:59:59+07:00`).toISOString();
}

export function formatGb(value: number): string {
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: digits }).format(value)} GB`;
}

export function countryName(code: string | null | undefined): string {
  if (!code) return "Tidak diketahui";
  try {
    return new Intl.DisplayNames(["id"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export function countryFlag(code: string | null | undefined): string {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function maskSecret(value: string): string {
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}
