// app/components/news/ArticleCard.tsx
//
// Restyled to match the cyan HUD theme (HudPanel / SearchBar / modal /
// landing page). Category chips keep a bit of per-category color so the
// grid stays scannable, but every chip stays inside the same translucent,
// uppercase, HUD-label treatment used elsewhere in the app.
import { ExternalLink } from "lucide-react";
import { HudPanel } from "@/app/components/HudPanel";
import type { NewsArticle } from "@/types/news";

const CATEGORY_STYLES: Record<string, string> = {
  World: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  Politics: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  Business: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  Technology: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  Science: "border-indigo-400/30 bg-indigo-400/10 text-indigo-200",
  Health: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  Sports: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  Entertainment: "border-pink-400/30 bg-pink-400/10 text-pink-200",
  Other: "border-stone-400/25 bg-stone-400/10 text-stone-300",
};

function categoryClass(category: string | undefined): string {
  if (category && category in CATEGORY_STYLES) {
    return CATEGORY_STYLES[category];
  }
  return CATEGORY_STYLES.Other;
}

interface ArticleCardProps {
  article: NewsArticle;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <HudPanel // inside the <HudPanel> className
        className="flex h-full flex-col transition-all duration-200 group-hover:border-cyan-400/60 group-hover:shadow-[0_0_60px_-14px_rgba(34,211,238,0.55)]"
      >
        <div className="relative h-44 w-full overflow-hidden border-b border-cyan-400/15 bg-[#0a1219]">
          {article.imageUrl ? (
            // Hero images come from arbitrary scraped domains, so a plain
            // <img> is used instead of next/image (which would need every
            // possible source domain allow-listed in next.config).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.imageUrl}
              alt={article.title}
              className="h-full w-full object-cover opacity-90 transition-opacity duration-200 group-hover:opacity-100"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-[family-name:var(--font-hud)] text-xs uppercase tracking-[0.2em] text-cyan-200/30">
              No image available
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#04070a] via-transparent to-transparent" />
          {article.category && (
            <span
              className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 font-[family-name:var(--font-hud)] text-[10px] font-semibold uppercase tracking-[0.15em] backdrop-blur-sm ${categoryClass(
                article.category,
              )}`}
            >
              {article.category}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="font-[family-name:var(--font-display)] text-base font-semibold leading-snug text-cyan-50 transition-colors group-hover:text-cyan-300">
            {article.title}
          </h3>
          <p className="line-clamp-3 text-sm leading-relaxed text-stone-400">
            {article.summary}
          </p>
          <div className="mt-auto flex items-center justify-between pt-3 font-[family-name:var(--font-hud)] text-[11px] uppercase tracking-[0.15em] text-cyan-200/40">
            <span className="truncate">{article.source ?? "Source"}</span>
            <span className="flex shrink-0 items-center gap-1 text-cyan-300 transition-colors group-hover:text-cyan-200">
              Read <ExternalLink size={11} />
            </span>
          </div>
        </div>
      </HudPanel>
    </a>
  );
}
