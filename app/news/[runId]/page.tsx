// app/news/[runId]/page.tsx
"use client";

import { use, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArchivedRunFeed } from "@/app/components/news/ArchivedRunFeed";
import type { Id } from "@/convex/_generated/dataModel";

const READOUTS = [
  ["ARCH", "RUN", "ID"],
  ["WIRE", "SRC", "NET"],
  ["DESK", "TOP", "BRK"],
  ["AP", "World", "24H"],
  ["FEED", "GMT", "LIVE"],
  ["BIZ", "TECH", "SCI"],
];

const RAIN_COLUMNS = Array.from({ length: 10 }).map((_, i) => ({
  left: `${(i / 9) * 100}%`,
  tokens: READOUTS[i % READOUTS.length],
  duration: 15 + (i % 4) * 2.4,
  delay: (i % 6) * 0.7,
}));

const PULSES = [
  { top: "6%", left: "4%", delay: 0.2 },
  { top: "15%", left: "93%", delay: 1.3 },
  { top: "35%", left: "5%", delay: 2.1 },
  { top: "55%", left: "95%", delay: 0.7 },
  { top: "75%", left: "7%", delay: 1.8 },
  { top: "88%", left: "90%", delay: 0.4 },
];

interface ArchivedNewsPageProps {
  params: Promise<{ runId: string }>;
}

export default function ArchivedNewsPage({ params }: ArchivedNewsPageProps) {
  const { runId } = use(params);
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-[calc(100vh-7rem)]">
      {/* full-height soft rain */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {RAIN_COLUMNS.map((col, i) => (
          <motion.div
            key={i}
            className="absolute top-0 flex flex-col gap-11 font-[family-name:var(--font-hud)] text-[11px] uppercase tracking-[0.18em]"
            style={{
              left: col.left,
              color:
                i % 3 === 0
                  ? "rgba(34,211,238,0.16)"
                  : i % 3 === 1
                    ? "rgba(34,211,238,0.11)"
                    : "rgba(220,38,38,0.09)",
              textShadow:
                i % 3 === 0
                  ? "0 0 10px rgba(34,211,238,0.4)"
                  : "0 0 6px rgba(34,211,238,0.2)",
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)",
            }}
            animate={reduceMotion ? undefined : { y: ["-55%", "165%"] }}
            transition={{
              duration: col.duration,
              repeat: Infinity,
              delay: col.delay,
              ease: "linear",
            }}
          >
            {[...col.tokens, ...col.tokens, ...col.tokens].map((t, j) => (
              <span key={j} className="select-none">
                {t}
              </span>
            ))}
          </motion.div>
        ))}
      </div>

      {/* glowing dust */}
      {PULSES.map((s, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute z-0 h-1.5 w-1.5 rounded-full bg-cyan-300/70"
          style={{
            top: s.top,
            left: s.left,
            boxShadow: "0 0 8px 2px rgba(34,211,238,0.45)",
          }}
          animate={reduceMotion ? undefined : { opacity: [0.04, 0.5, 0.04] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="relative z-10 p-2 sm:p-4">
        <ArchivedRunFeed runId={runId as Id<"newsRuns">} />
      </div>
    </div>
  );
}
