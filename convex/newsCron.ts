// convex/newsCron.ts
//
// Internal-only entry point used by convex/crons.ts. Kept separate from
// the public requestGeneration mutation in convex/news.ts because the
// cron should always create a fresh run (no "is it still fresh?" check --
// that's only useful for user-mashed-the-button dedupe).
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { NEWS_SEARCH_QUERY } from "./lib";

export const triggerDailyGeneration = internalMutation({
  args: {},
  handler: async (ctx): Promise<void> => {
    const runId = await ctx.db.insert("newsRuns", {
      status: "pending" as const,
      query: NEWS_SEARCH_QUERY,
      requestedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.newsActions.generate, { runId });
  },
});
