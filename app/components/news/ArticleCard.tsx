// app/components/news/ArticleCard.tsx
"use client";

import { ExternalLink } from "lucide-react";
import { HudPanel } from "@/app/components/HudPanel";
import type { NewsArticle } from "@/types/news";
import { useColorTheme } from "@/app/context/ColorThemeContext";
import { useState } from "react";

const CATEGORY_FIXED: Record<string, string> = {
  Politics: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  Business: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  Technology: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  Science: "border-indigo-400/30 bg-indigo-400/10 text-indigo-200",
  Health: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  Sports: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  Entertainment: "border-pink-400/30 bg-pink-400/10 text-pink-200",
  Other: "border-stone-400/25 bg-stone-400/10 text-stone-300",
};

interface ArticleCardProps {
  article: NewsArticle;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const { theme } = useColorTheme();
  const { hex400, shades } = theme;
  const [hovered, setHovered] = useState(false);

  const isWorldOrDefault =
    !article.category ||
    article.category === "World" ||
    !(article.category in CATEGORY_FIXED);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="transition-all duration-200"
        style={
          hovered
            ? {
                // outer glow when hovered — HudPanel sits inside
                filter: undefined,
              }
            : undefined
        }
      >
        <HudPanel className="flex h-full flex-col transition-all duration-200">
          {/* Force hover border on the panel via a wrapper style when hovered */}
          <div
            className="pointer-events-none absolute inset-0 rounded-xl transition-all duration-200"
            style={
              hovered
                ? {
                    boxShadow: `0 0 60px -14px ${hex400}8c`,
                    border: `1px solid ${hex400}99`,
                  }
                : undefined
            }
          />

          <div
            className="relative h-44 w-full overflow-hidden border-b bg-[#0a1219]"
            style={{ borderColor: `${hex400}26` }}
          >
            {article.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.imageUrl}
                alt={article.title}
                className="h-full w-full object-cover opacity-90 transition-opacity duration-200"
                style={{ opacity: hovered ? 1 : 0.9 }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-[family-name:var(--font-hud)] text-xs uppercase tracking-[0.2em] text-stone-500">
                No image available
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#04070a] via-transparent to-transparent" />
            {article.category && (
              <span
                className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 font-[family-name:var(--font-hud)] text-[10px] font-semibold uppercase tracking-[0.15em] backdrop-blur-sm ${
                  isWorldOrDefault ? "" : CATEGORY_FIXED[article.category]
                }`}
                style={
                  isWorldOrDefault
                    ? {
                        borderColor: `${hex400}4d`,
                        backgroundColor: `${hex400}1a`,
                        color: shades[300],
                      }
                    : undefined
                }
              >
                {article.category}
              </span>
            )}
          </div>

          <div className="relative flex flex-1 flex-col gap-2 p-4">
            <h3
              className="font-[family-name:var(--font-display)] text-base font-semibold leading-snug transition-colors duration-200"
              style={{ color: hovered ? hex400 : "#fafaf9" /* stone-50 */ }}
            >
              {article.title}
            </h3>
            <p className="line-clamp-3 text-sm leading-relaxed text-stone-400">
              {article.summary}
            </p>
            <div className="mt-auto flex items-center justify-between pt-3 font-[family-name:var(--font-hud)] text-[11px] uppercase tracking-[0.15em] text-stone-500">
              <span className="truncate">{article.source ?? "Source"}</span>
              <span
                className="flex shrink-0 items-center gap-1 transition-colors duration-200"
                style={{ color: hovered ? hex400 : shades[300] }}
              >
                Read <ExternalLink size={11} />
              </span>
            </div>
          </div>
        </HudPanel>
      </div>
    </a>
  );
}
