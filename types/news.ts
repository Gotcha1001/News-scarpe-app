// types/news.ts
//
// Thin, strictly-typed aliases over the Convex-generated document types so
// components/hooks don't need to import from convex/_generated/dataModel
// directly everywhere. No `any` anywhere in this pipeline.
import type { Doc, Id } from "@/convex/_generated/dataModel";

export type NewsRun = Doc<"newsRuns">;
export type NewsRunId = Id<"newsRuns">;
export type NewsRunStatus = NewsRun["status"];

export type NewsArticle = Doc<"newsArticles">;
export type NewsArticleId = Id<"newsArticles">;
