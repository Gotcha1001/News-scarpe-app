// hooks/useNewsFeed.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { NEWS_RUN_STALE_MS } from "@/convex/lib";
import type { NewsArticle, NewsRun, NewsRunId } from "@/types/news";

interface UseNewsFeedResult {
  /** The run currently being shown/tracked (latest, or one we just started). */
  run: NewsRun | null;
  /** Articles for that run, once completed. Null until loaded/available. */
  articles: NewsArticle[] | null;
  /** True while a pending/running generation is in flight. */
  isGenerating: boolean;
  /** True if the tracked run ended in "failed" (or went stale). */
  hasFailed: boolean;
  /** Kick off (or reuse) a generation run. */
  generate: () => Promise<void>;
}

export function useNewsFeed(): UseNewsFeedResult {
  const latestRun = useQuery(api.news.getLatestRun, {});
  const [activeRunId, setActiveRunId] = useState<NewsRunId | null>(null);
  const requestGeneration = useMutation(api.news.requestGeneration);

  const trackedRunId: NewsRunId | null = activeRunId ?? latestRun?._id ?? null;

  const trackedRun = useQuery(
    api.news.getRun,
    trackedRunId ? { runId: trackedRunId } : "skip",
  );

  const articles = useQuery(
    api.news.getArticlesForRun,
    trackedRun && trackedRun.status === "completed"
      ? { runId: trackedRun._id }
      : "skip",
  );

  const generate = useCallback(async (): Promise<void> => {
    const runId = await requestGeneration({});
    setActiveRunId(runId);
  }, [requestGeneration]);

  // Tracks *which run id* has gone stale, rather than a plain boolean.
  // isStale is then derived by comparison below, so switching to a new
  // trackedRun automatically reads as "not stale" with no reset call needed.
  const [staleRunId, setStaleRunId] = useState<NewsRunId | null>(null);

  useEffect(() => {
    if (
      !trackedRun ||
      (trackedRun.status !== "pending" && trackedRun.status !== "running")
    ) {
      return;
    }

    const remaining = NEWS_RUN_STALE_MS - (Date.now() - trackedRun.requestedAt);
    // Always deferred via setTimeout (even when already overdue, delay 0),
    // so setState is never called synchronously inside the effect body.
    const timeoutId = setTimeout(
      () => setStaleRunId(trackedRun._id),
      Math.max(remaining, 0),
    );
    return () => clearTimeout(timeoutId);
  }, [trackedRun]);

  const isStale = !!trackedRun && trackedRun._id === staleRunId;

  const isGenerating =
    !isStale &&
    (trackedRun?.status === "pending" || trackedRun?.status === "running");
  const hasFailed = trackedRun?.status === "failed" || isStale;

  return {
    run: trackedRun ?? null,
    articles: articles ?? null,
    isGenerating,
    hasFailed,
    generate,
  };
}
