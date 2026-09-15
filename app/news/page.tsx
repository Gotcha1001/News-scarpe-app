// app/news/page.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { NewsFeed } from "@/app/components/news/NewsFeed";

const READOUTS = [
  ["AP", "World", "12:04"],
  ["Reuters", "Biz", "03m"],
  ["BBC", "Tech", "1.2k"],
  ["AFP", "Sci", "08m"],
  ["Wire", "Pol.", "44s"],
  ["Desk", "Top", "BRK"],
  ["LIVE", "UPD", "GMT"],
  ["FEED", "SRC", "NET"],
  ["ARCH", "RUN", "ID"],
];

const RAIN_COLUMNS = Array.from({ length: 12 }).map((_, i) => ({
  left: `${(i / 11) * 100}%`,
  tokens: READOUTS[i % READOUTS.length],
  duration: 14 + (i % 5) * 2.2,
  delay: (i % 7) * 0.65,
}));

const PULSES = [
  { top: "5%", left: "3%", delay: 0 },
  { top: "11%", left: "94%", delay: 1.1 },
  { top: "28%", left: "6%", delay: 2.0 },
  { top: "42%", left: "91%", delay: 0.5 },
  { top: "58%", left: "4%", delay: 1.6 },
  { top: "72%", left: "96%", delay: 2.4 },
  { top: "85%", left: "8%", delay: 0.9 },
];

export default function NewsPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-[calc(100vh-7rem)]">
      {/* ===== full-height rain (soft glow + see-through) ===== */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {RAIN_COLUMNS.map((col, i) => (
          <motion.div
            key={i}
            className="absolute top-0 flex flex-col gap-10 font-[family-name:var(--font-hud)] text-[11px] uppercase tracking-[0.18em]"
            style={{
              left: col.left,
              color:
                i % 3 === 0
                  ? "rgba(34,211,238,0.18)"
                  : i % 3 === 1
                    ? "rgba(34,211,238,0.12)"
                    : "rgba(220,38,38,0.10)",
              textShadow:
                i % 3 === 0
                  ? "0 0 10px rgba(34,211,238,0.45)"
                  : "0 0 6px rgba(34,211,238,0.25)",
              // soft fade only at the very edges so tokens stay visible all the way down
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
            }}
            animate={
              reduceMotion ? undefined : { y: ["-60%", "160%"] } // starts higher + travels further
            }
            transition={{
              duration: col.duration,
              repeat: Infinity,
              delay: col.delay,
              ease: "linear",
            }}
          >
            {/* repeat the token list so the column is long enough to fill the page */}
            {[...col.tokens, ...col.tokens, ...col.tokens].map((t, j) => (
              <span key={j} className="select-none opacity-90">
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
          className="pointer-events-none absolute z-0 h-1.5 w-1.5 rounded-full bg-cyan-300/80"
          style={{
            top: s.top,
            left: s.left,
            boxShadow: "0 0 8px 2px rgba(34,211,238,0.5)",
          }}
          animate={reduceMotion ? undefined : { opacity: [0.05, 0.55, 0.05] }}
          transition={{
            duration: 3.8,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* content above the rain */}
      <div className="relative z-10 p-2 sm:p-4">
        <NewsFeed />
      </div>
    </div>
  );
}
