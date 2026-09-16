// app/archive/page.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Trash2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatFullDate } from "@/lib/formData";
import { HudLabel, HudPanel } from "@/app/components/HudPanel";
import { SearchBar } from "@/app/components/SearchBar";
import { useColorTheme } from "@/app/context/ColorThemeContext";

const READOUTS = [
  ["ARCH", "2024", "RUN"],
  ["WIRE", "AP", "24H"],
  ["DESK", "TOP", "BRK"],
  ["FEED", "SRC", "NET"],
  ["WORLD", "BIZ", "TECH"],
];

const RAIN_COLUMNS = Array.from({ length: 7 }).map((_, i) => ({
  left: `${(i / 6) * 100}%`,
  tokens: READOUTS[i % READOUTS.length],
  duration: 11 + (i % 3) * 1.4,
  delay: (i % 4) * 0.8,
}));

const PULSES = [
  { top: "6%", left: "5%", delay: 0.2 },
  { top: "12%", left: "90%", delay: 1.1 },
  { top: "60%", left: "3%", delay: 1.8 },
  { top: "72%", left: "93%", delay: 0.6 },
];

export default function ArchivePage() {
  const runs = useQuery(api.news.getRecentRuns, { limit: 30 });
  const deleteRun = useMutation(api.news.deleteRun);
  const deleteAllRuns = useMutation(api.news.deleteAllRuns);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<Id<"newsRuns"> | null>(null);
  const [clearing, setClearing] = useState(false);
  const reduceMotion = useReducedMotion();
  const { theme } = useColorTheme();
  const { hex400, shades } = theme;

  const filteredRuns = useMemo(() => {
    if (!runs) return runs;
    const term = search.trim().toLowerCase();
    if (!term) return runs;
    return runs.filter((run) =>
      (run.summary ?? "").toLowerCase().includes(term),
    );
  }, [runs, search]);

  const handleDelete = async (runId: Id<"newsRuns">) => {
    if (!window.confirm("Delete this digest? This can’t be undone.")) return;
    setDeletingId(runId);
    try {
      await deleteRun({ runId });
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL archived digests? This can’t be undone."))
      return;
    setClearing(true);
    try {
      await deleteAllRuns({});
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-3xl">
      {/* rain */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-35">
        {RAIN_COLUMNS.map((col, i) => (
          <motion.div
            key={i}
            className="absolute top-0 flex flex-col gap-6 font-[family-name:var(--font-hud)] text-[10px]"
            style={{
              left: col.left,
              color: i % 2 === 0 ? `${hex400}40` : "rgba(220,38,38,0.16)",
              maskImage:
                "linear-gradient(to bottom, transparent, black 18%, black 72%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent, black 18%, black 72%, transparent)",
            }}
            animate={reduceMotion ? undefined : { y: ["-25%", "125%"] }}
            transition={{
              duration: col.duration,
              repeat: Infinity,
              delay: col.delay,
              ease: "linear",
            }}
          >
            {col.tokens.map((t, j) => (
              <span key={j}>{t}</span>
            ))}
          </motion.div>
        ))}
      </div>

      {/* orbitals */}
      {PULSES.map((s, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute h-1.5 w-1.5 rounded-full"
          style={{ top: s.top, left: s.left, backgroundColor: shades[300] }}
          animate={reduceMotion ? undefined : { opacity: [0.1, 0.5, 0.1] }}
          transition={{
            duration: 3.4,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="relative mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <HudLabel>Archive</HudLabel>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-black tracking-tight text-stone-50">
            News <span style={{ color: hex400 }}>Archive</span>
          </h1>
        </div>
        {runs && runs.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            disabled={clearing}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {clearing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Clear all
          </button>
        )}
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search past digests..."
      />

      {runs === undefined && (
        <p className="font-[family-name:var(--font-hud)] text-xs uppercase tracking-[0.2em] text-stone-500">
          Loading archive...
        </p>
      )}

      {runs && runs.length === 0 && (
        <p className="text-sm text-stone-400">No completed news runs yet.</p>
      )}

      {runs && runs.length > 0 && filteredRuns && filteredRuns.length === 0 && (
        <p className="text-sm text-stone-400">
          No digests match &quot;{search}&quot;.
        </p>
      )}

      <ul className="relative flex flex-col gap-3">
        {filteredRuns?.map((run) => (
          <li key={run._id}>
            <HudPanel className="transition-all duration-200">
              <div className="flex items-center gap-3 p-4">
                <Link
                  href={`/news/${run._id}`}
                  className="group min-w-0 flex-1"
                >
                  <p className="font-[family-name:var(--font-hud)] text-[11px] uppercase tracking-[0.15em] text-stone-500">
                    {run.completedAt
                      ? formatFullDate(run.completedAt)
                      : "Unknown date"}
                  </p>
                  <p
                    className="mt-1 truncate text-sm font-semibold text-stone-50 transition-colors group-hover:opacity-90"
                    style={
                      {
                        // hover color applied via onMouseEnter below would need state per row;
                        // use a simple accent on the chevron instead for clarity
                      } as React.CSSProperties
                    }
                  >
                    <ArchiveRowTitle summary={run.summary} hex400={hex400} />
                  </p>
                </Link>
                <button
                  type="button"
                  title="Delete digest"
                  aria-label="Delete digest"
                  disabled={deletingId === run._id}
                  onClick={() => handleDelete(run._id)}
                  className="shrink-0 rounded-md border border-transparent p-1.5 text-stone-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                >
                  {deletingId === run._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
                <Link href={`/news/${run._id}`}>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 transition-colors"
                    style={{ color: `${hex400}80` }}
                  />
                </Link>
              </div>
            </HudPanel>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Title that shifts to accent on hover without per-row state. */
function ArchiveRowTitle({
  summary,
  hex400,
}: {
  summary: string | undefined;
  hex400: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ color: hovered ? hex400 : "#fafaf9" }}
      className="transition-colors"
    >
      {summary ?? "Untitled digest"}
    </span>
  );
}
