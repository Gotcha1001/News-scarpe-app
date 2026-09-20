// convex/news.ts
//
// Public-facing surface for the news feed. This is the file the frontend
// talks to directly (via api.news.*). The actual scraping/AI pipeline lives
// in the already-built convex/newsActions.ts + convex/newsMutations.ts,
// which stay internal-only.
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  NEWS_RUN_STALE_MS,
  NEWS_SEARCH_QUERY,
  isNewsRunStillFresh,
} from "./lib";
/** Most recently requested run (any status), newest first. */
export const getLatestRun = query({
  args: {},
  handler: async (ctx) => {
    const latest = await ctx.db
      .query("newsRuns")
      .withIndex("by_requestedAt")
      .order("desc")
      .first();
    return latest ?? null;
  },
});
/** A single run by id -- used to poll status while generating. */
export const getRun = query({
  args: { runId: v.id("newsRuns") },
  handler: async (ctx, { runId }) => {
    return (await ctx.db.get(runId)) ?? null;
  },
});
/** Articles belonging to one run, in the model's relevance order. */
export const getArticlesForRun = query({
  args: { runId: v.id("newsRuns") },
  handler: async (ctx, { runId }) => {
    const articles = await ctx.db
      .query("newsArticles")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .collect();
    return articles.slice().sort((a, b) => a.order - b.order);
  },
});
/** Completed runs, newest first -- powers the /archive page. */
export const getRecentRuns = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const runs = await ctx.db
      .query("newsRuns")
      .withIndex("by_requestedAt")
      .order("desc")
      .collect();
    return runs
      .filter((run) => run.status === "completed")
      .slice(0, limit ?? 20);
  },
});
/** One slide in the home-page "past headlines" carousel. */
interface ArchiveCarouselRow {
  articleId: Id<"newsArticles">;
  runId: Id<"newsRuns">;
  title: string;
  imageUrl: string;
  source: string | undefined;
  category: string | undefined;
  /** When the run that produced this article finished (ms since epoch). */
  runDate: number;
}

/**
 * Past headlines for the landing-page carousel: the top few articles
 * that have a picture from each recent completed run, newest run first.
 *
 * Deliberately has no auth check -- the landing page is visible to
 * signed-out visitors, and news runs are shared (not per-user) data.
 * Articles without an image are skipped, and a story that appears in
 * several runs is only shown once.
 */
export const getArchiveCarousel = query({
  args: {
    runLimit: v.optional(v.number()),
    perRun: v.optional(v.number()),
  },
  handler: async (ctx, { runLimit, perRun }): Promise<ArchiveCarouselRow[]> => {
    const runs = await ctx.db
      .query("newsRuns")
      .withIndex("by_requestedAt")
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .take(runLimit ?? 8);

    const articlesPerRun = await Promise.all(
      runs.map((run) =>
        ctx.db
          .query("newsArticles")
          .withIndex("by_run", (q) => q.eq("runId", run._id))
          .collect(),
      ),
    );

    const maxPerRun = perRun ?? 3;
    const seenUrls = new Set<string>();
    const rows: ArchiveCarouselRow[] = [];

    runs.forEach((run, index) => {
      const ordered = articlesPerRun[index]
        .slice()
        .sort((a, b) => a.order - b.order);
      let taken = 0;
      for (const article of ordered) {
        if (taken >= maxPerRun) break;
        if (!article.imageUrl || seenUrls.has(article.url)) continue;
        seenUrls.add(article.url);
        rows.push({
          articleId: article._id,
          runId: run._id,
          title: article.title,
          imageUrl: article.imageUrl,
          source: article.source,
          category: article.category,
          runDate: run.completedAt ?? run.requestedAt,
        });
        taken += 1;
      }
    });

    return rows;
  },
});

/**
 * Called when the user hits "Refresh news". Reuses a fresh completed run
 * or an already in-flight run instead of spending Tavily/OpenRouter calls
 * again, otherwise kicks off a brand new run and returns its id so the
 * frontend can poll it in the generating modal.
 *
 * A completed run stays "fresh" until 01:00 the next morning.
 */
export const requestGeneration = mutation({
  args: {},
  handler: async (ctx): Promise<Id<"newsRuns">> => {
    const latest = await ctx.db
      .query("newsRuns")
      .withIndex("by_requestedAt")
      .order("desc")
      .first();
    const isFresh =
      latest !== null &&
      latest.status === "completed" &&
      latest.completedAt !== undefined &&
      isNewsRunStillFresh(latest.completedAt);
    if (latest && isFresh) return latest._id;
    const isActive =
      latest !== null &&
      (latest.status === "pending" || latest.status === "running");
    const isStale =
      isActive && Date.now() - latest.requestedAt >= NEWS_RUN_STALE_MS;
    if (isActive && !isStale) {
      return latest._id; // genuinely in-flight — reuse it
    }
    if (isActive && isStale) {
      // Dead run from a crashed/timed-out action — stop pretending it's running.
      await ctx.db.patch(latest._id, {
        status: "failed" as const,
        failureReason: "stale_timeout",
        completedAt: Date.now(),
      });
    }
    const runId = await ctx.db.insert("newsRuns", {
      status: "pending" as const,
      query: NEWS_SEARCH_QUERY,
      requestedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.newsActions.generate, { runId });
    return runId;
  },
});
/** Delete one completed run and all of its articles. */
export const deleteRun = mutation({
  args: { runId: v.id("newsRuns") },
  handler: async (ctx, { runId }) => {
    const run = await ctx.db.get(runId);
    if (!run) return;
    // Delete all articles that belong to this run
    const articles = await ctx.db
      .query("newsArticles")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .collect();
    await Promise.all(articles.map((a) => ctx.db.delete(a._id)));
    await ctx.db.delete(runId);
  },
});
/** Delete every completed run and their articles. */
export const deleteAllRuns = mutation({
  args: {},
  handler: async (ctx) => {
    const runs = await ctx.db
      .query("newsRuns")
      .withIndex("by_requestedAt")
      .collect();
    const completed = runs.filter((r) => r.status === "completed");
    for (const run of completed) {
      const articles = await ctx.db
        .query("newsArticles")
        .withIndex("by_run", (q) => q.eq("runId", run._id))
        .collect();
      await Promise.all(articles.map((a) => ctx.db.delete(a._id)));
      await ctx.db.delete(run._id);
    }
  },
});
