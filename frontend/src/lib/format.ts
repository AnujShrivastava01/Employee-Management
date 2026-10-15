const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2, minimumFractionDigits: 0 });
const inrCompact = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 });
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatSalary(value: number): string {
  return inr.format(value);
}

export function formatSalaryCompact(value: number): string {
  return inrCompact.format(value);
}

/** Parses an ISO yyyy-MM-dd date as a *local* date so it never shifts by a day. */
export function parseIsoDate(value: string): Date {
  const [year = 1970, month = 1, day = 1] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** "26 Sep 2022" — built by hand because Intl renders September as "Sept" in some locales. */
export function formatDate(value: string): string {
  const date = parseIsoDate(value);
  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function todayIso(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** "today", "yesterday", "5 days ago", "3 months ago", "2 years ago". */
export function formatRelativeDate(value: string, now = new Date()): string {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((start.getTime() - parseIsoDate(value).getTime()) / 86_400_000);
  if (days < 0) return `in ${-days} day${days === -1 ? "" : "s"}`;
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 31) return `${days} days ago`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function statusLabel(status: "ACTIVE" | "INACTIVE"): string {
  return status === "ACTIVE" ? "Active" : "Inactive";
}
