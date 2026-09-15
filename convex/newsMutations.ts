import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const markRunning = internalMutation({
  args: { runId: v.id("newsRuns") },
  handler: async (ctx, { runId }) => {
    await ctx.db.patch(runId, { status: "running" as const });
  },
});

export const markFailed = internalMutation({
  args: { runId: v.id("newsRuns"), reason: v.string() },
  handler: async (ctx, { runId, reason }) => {
    await ctx.db.patch(runId, {
      status: "failed" as const,
      failureReason: reason,
      completedAt: Date.now(),
    });
  },
});

export const saveArticles = internalMutation({
  args: {
    runId: v.id("newsRuns"),
    summary: v.string(),
    articles: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
        summary: v.string(),
        imageUrl: v.optional(v.string()),
        source: v.optional(v.string()),
        publishedDate: v.optional(v.string()),
        category: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { runId, summary, articles }) => {
    await Promise.all(
      articles.map((article, index) =>
        ctx.db.insert("newsArticles", {
          runId,
          order: index,
          title: article.title,
          url: article.url,
          summary: article.summary,
          imageUrl: article.imageUrl,
          source: article.source,
          publishedDate: article.publishedDate,
          category: article.category,
        }),
      ),
    );
    await ctx.db.patch(runId, {
      status: "completed" as const,
      summary,
      completedAt: Date.now(),
    });
  },
});
