// Shared, dependency-free helpers used by the news pipeline.

/**
 * Strips ```json ... ``` or ``` ... ``` fences some models add despite
 * being told not to, so JSON.parse doesn't choke on it.
 */
export function stripJsonFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

/**
 * Returns true if a completed news run should still be treated as
 * "today's" digest. We keep it until 01:00 the next morning.
 */
export function isNewsRunStillFresh(completedAt: number): boolean {
  const completed = new Date(completedAt);
  const nextCutoff = new Date(completed);

  // Move to the next calendar day at 01:00
  nextCutoff.setDate(nextCutoff.getDate() + 1);
  nextCutoff.setHours(1, 0, 0, 0);

  return Date.now() < nextCutoff.getTime();
}

/** The single canonical search query used for every run. */
export const NEWS_SEARCH_QUERY = "top world news today";

/** Max number of articles a single run will produce. */
export const MAX_ARTICLES = 10;

/** How long a run can sit at "pending"/"running" before we treat it as dead. */
export const NEWS_RUN_STALE_MS = 1000 * 60 * 3; // 3 minutes
