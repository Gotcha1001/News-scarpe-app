// app/components/news/NewsFeed.tsx
//
// Restyled to match the landing page / Navbar / AppSidebar / modal's cyan
// HUD language instead of the old white-card / red-accent look.
"use client";

import { useState } from "react";
import { RefreshCw, Signal } from "lucide-react";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import { ArticleCard } from "./ArticleCard";
import { NewsGeneratingModal } from "./NewsGeneratingModal";
import { HudPanel, HudLabel } from "@/app/components/HudPanel";
import { formatRelativeTime } from "@/lib/formData";

export function NewsFeed() {
  const { run, articles, isGenerating, hasFailed, generate } = useNewsFeed();
  const [dismissed, setDismissed] = useState<boolean>(false);

  // Derived directly during render — no effect needed.
  const modalOpen = (isGenerating || hasFailed) && !dismissed;

  const handleGenerate = (): void => {
    setDismissed(false); // reset so the modal shows for this new run
    void generate();
  };

  const hasArticles = articles !== null && articles.length > 0;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <HudLabel>Live feed</HudLabel>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-black tracking-tight text-cyan-50">
            Today&apos;s <span className="text-cyan-400">Top Stories</span>
          </h1>
          {run?.completedAt && (
            <p className="mt-2 font-[family-name:var(--font-hud)] text-[11px] uppercase tracking-[0.15em] text-cyan-200/40">
              Updated {formatRelativeTime(run.completedAt)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-[#04070a] shadow-[0_0_30px_-8px_rgba(34,211,238,0.6)] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={15} className={isGenerating ? "animate-spin" : ""} />
          {isGenerating ? "Generating..." : "Refresh news"}
        </button>
      </div>

      {run?.summary && (
        <HudPanel className="mb-6" scanline>
          <div className="flex items-start gap-3 p-4">
            <Signal className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
            <p className="text-sm leading-relaxed text-cyan-50/90">
              {run.summary}
            </p>
          </div>
        </HudPanel>
      )}

      {hasArticles ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles?.map((article) => (
            <ArticleCard key={article._id} article={article} />
          ))}
        </div>
      ) : (
        !isGenerating && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-cyan-400/25 bg-[#04070a]/60 py-20 text-center">
            <p className="font-[family-name:var(--font-hud)] text-xs uppercase tracking-[0.2em] text-cyan-200/40">
              No signal yet
            </p>
            <p className="max-w-sm text-sm text-stone-400">
              No news yet today. Generate the latest stories to get started.
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-5 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20"
            >
              Generate today&apos;s news
            </button>
          </div>
        )
      )}

      <NewsGeneratingModal
        open={modalOpen}
        hasFailed={hasFailed}
        onClose={() => setDismissed(true)}
      />
    </div>
  );
}
