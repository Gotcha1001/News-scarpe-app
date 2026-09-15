// lib/formatDate.ts
//
// Small, dependency-free date helpers for the news feed UI.

/** "3 min ago" / "2 hr ago" / "1 day ago" style relative timestamp. */
export function formatRelativeTime(timestampMs: number): string {
  const diffMs = Date.now() - timestampMs;
  const diffMinutes = Math.round(diffMs / 60_000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

/** "Monday, September 14, 2026, 9:41 AM" style full timestamp. */
export function formatFullDate(timestampMs: number): string {
  return new Date(timestampMs).toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
