// app/components/news/NewsGeneratingModal.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Radar,
  Search,
  ImageIcon,
  LayoutGrid,
  AlertTriangle,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useColorTheme } from "@/app/context/ColorThemeContext";
import { buildHudGridBackground } from "@/lib/colorThemes";

const NEWS_STEPS = [
  { icon: Radar, label: "Scanning the wires" },
  { icon: Search, label: "Cross-checking headlines" },
  { icon: ImageIcon, label: "Pulling front-page images" },
  { icon: LayoutGrid, label: "Laying out the digest" },
];

const ROTATE_INTERVAL_MS = 2800;

const PULSES = [
  { top: "12%", left: "10%", delay: 0 },
  { top: "22%", left: "86%", delay: 0.8 },
  { top: "70%", left: "8%", delay: 1.5 },
  { top: "80%", left: "88%", delay: 0.5 },
  { top: "48%", left: "92%", delay: 1.9 },
  { top: "58%", left: "6%", delay: 1.1 },
];

const READOUTS = [
  ["AP", "World", "12:04"],
  ["Reuters", "Biz", "03m"],
  ["BBC", "Tech", "1.2k"],
  ["AFP", "Sci", "08m"],
  ["Wire", "Pol.", "44s"],
];

const RAIN_COLUMNS = Array.from({ length: 6 }).map((_, i) => ({
  left: `${(i / 5) * 100}%`,
  tokens: READOUTS[i % READOUTS.length],
  duration: 8 + (i % 4) * 1.8,
  delay: (i % 5) * 0.6,
}));

const flicker = {
  opacity: [0.55, 0.9, 0.5, 1, 0.6, 0.85, 0.55],
  scale: [0.95, 1.05, 0.92, 1.1, 0.97, 1.04, 0.95],
};

interface NewsGeneratingModalProps {
  open: boolean;
  hasFailed: boolean;
  onClose: () => void;
}

export function NewsGeneratingModal({
  open,
  hasFailed,
  onClose,
}: NewsGeneratingModalProps) {
  const [lineIndex, setLineIndex] = useState<number>(0);
  const reduceMotion = useReducedMotion();
  const { theme } = useColorTheme();
  const { hex400, shades } = theme;
  const gridBg = useMemo(() => buildHudGridBackground(theme), [theme]);

  useEffect(() => {
    if (!open || hasFailed) return;
    const id = setInterval(() => {
      setLineIndex((prev) => (prev + 1) % NEWS_STEPS.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [open, hasFailed]);

  const spin = (reverse = false) =>
    reduceMotion ? undefined : { rotate: reverse ? -360 : 360 };
  const spinTransition = (duration: number) =>
    reduceMotion
      ? { duration: 0 }
      : { duration, repeat: Infinity, ease: "linear" as const };

  const title = hasFailed
    ? "Couldn't fetch today's news"
    : "Generating today's news";
  const subtitle = hasFailed
    ? "Something went wrong pulling the latest stories."
    : "Scraping, summarizing, and laying out your digest";
  const CoreIcon = hasFailed ? AlertTriangle : Radar;

  // Failure stays red; success path uses theme accent
  const ringColor = hasFailed ? "#f87171" : hex400;
  const ringColorDim = hasFailed ? "#f8717160" : `${hex400}60`;
  const coreFrom = hasFailed ? "#b91c1c" : shades[700];
  const coreTo = hasFailed ? "#ef4444" : shades[500];
  const glowColor = hasFailed ? "#f87171" : shades[300];

  return (
    <Dialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton={hasFailed}
        className="sm:max-w-md border-0 bg-transparent p-0 shadow-none"
        onPointerDownOutside={(e) => {
          if (!hasFailed) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!hasFailed) e.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative overflow-hidden rounded-xl border bg-[#04070a] p-8 text-center"
            style={{
              borderColor: hasFailed ? "#f8717140" : `${hex400}40`,
              boxShadow: hasFailed
                ? "0 0 60px -12px rgba(248,113,113,0.5)"
                : `0 0 60px -12px ${hex400}80`,
            }}
          >
            {/* coordinate-grid texture */}
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage: `url("${gridBg}")`,
                backgroundSize: "48px 48px",
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0a1219_0%,_#04070a_75%)]" />

            {/* falling news-wire readouts */}
            {!hasFailed && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
                {RAIN_COLUMNS.map((col, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-0 flex flex-col gap-5 font-[family-name:var(--font-hud)] text-[10px]"
                    style={{
                      left: col.left,
                      color:
                        i % 2 === 0 ? `${hex400}59` : "rgba(220,38,38,0.25)",
                      maskImage:
                        "linear-gradient(to bottom, transparent, black 25%, black 65%, transparent)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, transparent, black 25%, black 65%, transparent)",
                    }}
                    animate={reduceMotion ? undefined : { y: ["-30%", "130%"] }}
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
            )}

            {/* idea-spark dust */}
            {!hasFailed &&
              PULSES.map((s, i) => (
                <motion.span
                  key={i}
                  className="pointer-events-none absolute h-1.5 w-1.5 rounded-full"
                  style={{
                    top: s.top,
                    left: s.left,
                    backgroundColor: shades[300],
                  }}
                  animate={
                    reduceMotion ? undefined : { opacity: [0.1, 0.7, 0.1] }
                  }
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: s.delay,
                    ease: "easeInOut",
                  }}
                />
              ))}

            {/* corner brackets */}
            {[
              "-left-px -top-px border-l-2 border-t-2",
              "-right-px -top-px border-r-2 border-t-2",
              "-left-px -bottom-px border-l-2 border-b-2",
              "-right-px -bottom-px border-r-2 border-b-2",
            ].map((cls, i) => (
              <div
                key={i}
                className={`pointer-events-none absolute ${cls} h-5 w-5`}
                style={{
                  borderColor: hasFailed ? "#f8717199" : `${hex400}99`,
                }}
              />
            ))}

            {/* scanline sweep */}
            {!hasFailed && (
              <motion.div
                className="pointer-events-none absolute left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(to right, transparent, ${shades[300]}80, transparent)`,
                }}
                animate={reduceMotion ? undefined : { top: ["0%", "100%"] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }}
              />
            )}

            {/* ===== flickering core ===== */}
            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
              <motion.div
                className="absolute inset-0 rounded-full border border-dashed"
                style={{ borderColor: ringColorDim }}
                animate={hasFailed ? undefined : spin()}
                transition={spinTransition(14)}
              />
              <motion.div
                className="absolute inset-1.5 rounded-full border"
                style={{
                  borderColor: hasFailed ? "#dc262680" : `${shades[600]}66`,
                }}
                animate={hasFailed ? undefined : spin(true)}
                transition={spinTransition(9)}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{
                  borderColor: hasFailed ? "#fca5a54d" : `${shades[300]}4d`,
                }}
                animate={
                  reduceMotion || hasFailed
                    ? undefined
                    : { scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }
                }
                transition={{ duration: 1.8, repeat: Infinity }}
              />
              <motion.div
                className="absolute h-10 w-10 rounded-full blur-xl"
                style={{ backgroundColor: glowColor }}
                animate={reduceMotion || hasFailed ? undefined : flicker}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div
                className="relative flex h-12 w-12 items-center justify-center rounded-full border"
                style={{
                  borderColor: `${ringColor}80`,
                  background: `linear-gradient(to bottom right, ${coreFrom}, ${coreTo})`,
                  boxShadow: `0 0 25px -4px ${ringColor}e6`,
                }}
              >
                <CoreIcon className="h-5 w-5 text-[#04070a]" />
              </div>
            </div>

            <h2 className="relative font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-stone-50">
              {title}
            </h2>
            <p className="relative mt-2 font-[family-name:var(--font-hud)] text-xs uppercase tracking-[0.2em] text-stone-400">
              {subtitle}
            </p>

            {/* cycling steps */}
            {!hasFailed && (
              <div className="relative mt-8 space-y-2.5">
                {NEWS_STEPS.map((step, i) => (
                  <StepRow
                    key={step.label}
                    step={step}
                    index={i}
                    active={i === lineIndex}
                    hex400={hex400}
                    shades={shades}
                  />
                ))}
              </div>
            )}

            {hasFailed && (
              <button
                type="button"
                onClick={onClose}
                className="relative mt-8 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
              >
                Try again
              </button>
            )}

            {/* progress bar */}
            {!hasFailed && (
              <div
                className="relative mt-8 h-1 overflow-hidden rounded-full"
                style={{ backgroundColor: `${hex400}1a` }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: "35%",
                    background: `linear-gradient(to right, ${shades[700]}, ${shades[300]}, ${shades[700]})`,
                  }}
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function StepRow({
  step,
  index,
  active,
  hex400,
  shades,
}: {
  step: (typeof NEWS_STEPS)[number];
  index: number;
  active: boolean;
  hex400: string;
  shades: { 300: string; 400: string; 500: string; 600: string; 700: string };
}) {
  const Icon = step.icon;

  return (
    <motion.div
      className="group flex items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors"
      style={{
        borderColor: active ? `${hex400}4d` : `${hex400}1a`,
        backgroundColor: active ? `${hex400}14` : `${hex400}0a`,
      }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.12 * index + 0.2, duration: 0.4 }}
    >
      <motion.div
        className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded border bg-[#0a1219]"
        style={{ borderColor: `${hex400}4d` }}
        animate={{
          borderColor: [`${hex400}4d`, `${shades[300]}b3`, `${hex400}4d`],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          delay: index * 0.5,
          ease: "easeInOut",
        }}
      >
        <Icon className="h-3 w-3" style={{ color: `${shades[300]}cc` }} />
      </motion.div>
      <span className="font-[family-name:var(--font-hud)] text-[13px] text-stone-200/80">
        {step.label}
        <motion.span
          className="inline-block"
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: index * 0.3,
          }}
        >
          …
        </motion.span>
      </span>
      <motion.span
        className="ml-auto h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: hex400 }}
        animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.3, 1] }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          delay: index * 0.25,
        }}
      />
    </motion.div>
  );
}
