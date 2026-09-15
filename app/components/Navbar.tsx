"use client";

// components/Navbar.tsx
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Globe2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

const ORBIT_TOKENS = [
  { label: "wire", radius: 20, duration: 7, delay: 0, startAngle: 20 },
  { label: "news", radius: 20, duration: 7, delay: 3.5, startAngle: 200 },
];

const flicker = {
  opacity: [0.55, 0.9, 0.5, 1, 0.6, 0.85, 0.55],
  scale: [0.95, 1.05, 0.92, 1.1, 0.97, 1.04, 0.95],
};

const GRID_BG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cg stroke='%2322d3ee' stroke-opacity='0.35' stroke-width='1'%3E%3Cpath d='M24 18v12M18 24h12'/%3E%3C/g%3E%3C/svg%3E";

function BrandMark() {
  const reduceMotion = useReducedMotion();

  const spin = (reverse = false) =>
    reduceMotion ? undefined : { rotate: reverse ? -360 : 360 };
  const spinTransition = (duration: number) =>
    reduceMotion
      ? { duration: 0 }
      : { duration, repeat: Infinity, ease: "linear" as const };

  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
      {!reduceMotion &&
        ORBIT_TOKENS.map((t) => (
          <motion.span
            key={t.label}
            className="pointer-events-none absolute font-[family-name:var(--font-hud)] text-[8px] font-medium uppercase tracking-wide text-cyan-300/80"
            style={{ left: "50%", top: "50%" }}
            animate={{
              x: Array.from({ length: 13 }, (_, i) => {
                const angle = ((t.startAngle + (i / 12) * 360) * Math.PI) / 180;
                return Math.cos(angle) * t.radius;
              }),
              y: Array.from({ length: 13 }, (_, i) => {
                const angle = ((t.startAngle + (i / 12) * 360) * Math.PI) / 180;
                return Math.sin(angle) * t.radius;
              }),
              opacity: [0, 1, 1, 1, 0],
            }}
            transition={{
              duration: t.duration,
              delay: t.delay,
              repeat: Infinity,
              ease: "linear",
              opacity: {
                duration: t.duration,
                delay: t.delay,
                repeat: Infinity,
                times: [0, 0.08, 0.5, 0.92, 1],
              },
            }}
          >
            {t.label}
          </motion.span>
        ))}

      <motion.div
        className="absolute inset-0 rounded-full border border-dashed border-cyan-400/40"
        animate={spin()}
        transition={spinTransition(10)}
      />
      <motion.div
        className="absolute inset-1 rounded-full border border-cyan-600/40"
        animate={spin(true)}
        transition={spinTransition(6.5)}
      />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-cyan-300/30"
        animate={
          reduceMotion
            ? undefined
            : { scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }
        }
        transition={{ duration: 1.8, repeat: Infinity }}
      />
      <motion.div
        className="absolute h-5 w-5 rounded-full bg-cyan-300 blur-md"
        animate={reduceMotion ? undefined : flicker}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative flex h-6 w-6 items-center justify-center rounded-full border border-cyan-400/50 bg-gradient-to-br from-cyan-700 to-cyan-500 shadow-[0_0_12px_-2px_rgba(34,211,238,0.9)]">
        <Globe2 className="h-3 w-3 text-[#04070a]" />
      </div>
    </div>
  );
}

export default function Navbar() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.nav
      className="relative grid grid-cols-3 items-center overflow-hidden border-b border-cyan-400/15 bg-white px-6 py-4 shadow-sm dark:border-cyan-400/20 dark:bg-[#04070a] dark:shadow-[0_0_30px_-10px_rgba(34,211,238,0.25)]"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* HUD background (dark mode) */}
      <div className="pointer-events-none absolute inset-0 hidden dark:block">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `url("${GRID_BG}")`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0a1219_0%,_#04070a_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
        {[
          "-left-px -top-px border-l-2 border-t-2",
          "-right-px -top-px border-r-2 border-t-2",
          "-left-px -bottom-px border-l-2 border-b-2",
          "-right-px -bottom-px border-r-2 border-b-2",
        ].map((cls) => (
          <div
            key={cls}
            className={`absolute ${cls} h-3.5 w-3.5 border-cyan-400/45`}
          />
        ))}
        {!reduceMotion && (
          <motion.div
            className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-300/35 to-transparent"
            animate={{ left: ["0%", "100%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      {/* Left — trigger */}
      <div className="relative z-10 justify-self-start">
        <SidebarTrigger className="text-slate-700 hover:text-cyan-600 dark:text-cyan-200/70 dark:hover:text-cyan-300" />
      </div>

      {/* Center — brand */}
      <div className="relative z-10 justify-self-center">
        <Link href="/" className="flex items-center gap-6">
          <BrandMark />
          <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-slate-900 dark:text-cyan-50">
            <span className="text-cyan-600 dark:text-cyan-400">GLOBE</span>
            WIRE
          </span>
        </Link>
      </div>

      {/* Right — actions */}
      <div className="relative z-10 flex items-center gap-3 justify-self-end">
        <SignedOut>
          <Link href="/sign-in">
            <Button
              variant="ghost"
              className="text-slate-700 hover:text-cyan-600 dark:text-cyan-100/80 dark:hover:text-cyan-300 dark:hover:bg-cyan-400/10"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="border border-cyan-400/40 bg-cyan-500 text-[#04070a] shadow-[0_0_20px_-6px_rgba(34,211,238,0.6)] hover:bg-cyan-400">
              Sign Up
            </Button>
          </Link>
        </SignedOut>
        <SignedIn>
          <ThemeToggle />
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </motion.nav>
  );
}
