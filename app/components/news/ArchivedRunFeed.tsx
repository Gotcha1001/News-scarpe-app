// app/components/news/ArchivedRunFeed.tsx
//
// Read-only counterpart to NewsFeed for a single archived run — same HUD
// styling, no refresh/generate controls since a completed run's articles
// never change.
"use client";

import Link from "next/link";
import { ArrowLeft, Signal } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatFullDate } from "@/lib/formData";
import { HudLabel, HudPanel } from "@/app/components/HudPanel";
import { ArticleCard } from "./ArticleCard";

interface ArchivedRunFeedProps {
  runId: Id<"newsRuns">;
}

export function ArchivedRunFeed({ runId }: ArchivedRunFeedProps) {
  const run = useQuery(api.news.getRun, { runId });
  const articles = useQuery(api.news.getArticlesForRun, { runId });

  if (run === undefined || articles === undefined) {
    return (
      <div className="mx-auto max-w-6xl">
        <p className="font-[family-name:var(--font-hud)] text-xs uppercase tracking-[0.2em] text-cyan-200/40">
          Loading digest...
        </p>
      </div>
    );
  }

  if (run === null) {
    return (
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-stone-400">
          This digest couldn&apos;t be found.
        </p>
        <Link
          href="/archive"
          className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200"
        >
          <ArrowLeft size={14} /> Back to archive
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/archive"
        className="mb-4 inline-flex items-center gap-2 font-[family-name:var(--font-hud)] text-xs uppercase tracking-[0.15em] text-cyan-200/50 transition-colors hover:text-cyan-300"
      >
        <ArrowLeft size={13} /> Back to archive
      </Link>

      <div className="mb-6">
        <HudLabel>Archived digest</HudLabel>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-black tracking-tight text-cyan-50">
          {run.completedAt ? formatFullDate(run.completedAt) : "Unknown date"}
        </h1>
      </div>

      {run.summary && (
        <HudPanel className="mb-6">
          <div className="flex items-start gap-3 p-4">
            <Signal className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
            <p className="text-sm leading-relaxed text-cyan-50/90">
              {run.summary}
            </p>
          </div>
        </HudPanel>
      )}

      {articles.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article._id} article={article} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-cyan-400/25 bg-[#04070a]/60 py-20 text-center">
          <p className="text-sm text-stone-400">
            This run has no saved articles.
          </p>
        </div>
      )}
    </div>
  );
}
