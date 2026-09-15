import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  // One row per "generate latest news" run. The Tavily + OpenRouter
  // pipeline works against a single run at a time; the frontend polls
  // this table (via convex/news.ts:getRun) to drive the
  // "Generating today's news..." modal.
  newsRuns: defineTable({
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    query: v.string(),
    requestedAt: v.number(),
    completedAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
    // One-sentence "what's going on in the world today" line generated
    // alongside the articles, shown above the article grid.
    summary: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_requestedAt", ["requestedAt"]),

  // Individual news articles produced by a run. Kept in their own table
  // (rather than embedded on newsRuns) so the page can render articles
  // with a plain indexed query and so a run document stays small.
  newsArticles: defineTable({
    runId: v.id("newsRuns"),
    title: v.string(),
    url: v.string(),
    summary: v.string(),
    // Best-effort hero image scraped via Tavily's /extract endpoint.
    // Omitted when nothing usable was found -- the UI falls back to a
    // text-only card in that case.
    imageUrl: v.optional(v.string()),
    source: v.optional(v.string()),
    publishedDate: v.optional(v.string()),
    category: v.optional(v.string()),
    // Preserves the model's relevance ordering (0 = most significant).
    order: v.number(),
  })
    .index("by_run", ["runId"])
    .index("by_url", ["url"]),
});
