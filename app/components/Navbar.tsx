// app/components/Navbar.tsx
"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Globe2 } from "lucide-react";
import { useMemo } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useColorTheme } from "@/app/context/ColorThemeContext";
import { buildHudGridBackground } from "@/lib/colorThemes";

const ORBIT_TOKENS = [
  { label: "wire", radius: 20, duration: 7, delay: 0, startAngle: 20 },
  { label: "news", radius: 20, duration: 7, delay: 3.5, startAngle: 200 },
];

const flicker = {
  opacity: [0.55, 0.9, 0.5, 1, 0.6, 0.85, 0.55],
  scale: [0.95, 1.05, 0.92, 1.1, 0.97, 1.04, 0.95],
};

function BrandMark({
  hex400,
  hex300,
  hex500,
  hex600,
  hex700,
}: {
  hex400: string;
  hex300: string;
  hex500: string;
  hex600: string;
  hex700: string;
}) {
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
            className="pointer-events-none absolute font-[family-name:var(--font-hud)] text-[8px] font-medium uppercase tracking-wide"
            style={{ left: "50%", top: "50%", color: hex300, opacity: 0.8 }}
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
        className="absolute inset-0 rounded-full border border-dashed"
        style={{ borderColor: `${hex400}66` }}
        animate={spin()}
        transition={spinTransition(10)}
      />
      <motion.div
        className="absolute inset-1 rounded-full border"
        style={{ borderColor: `${hex600}66` }}
        animate={spin(true)}
        transition={spinTransition(6.5)}
      />
      <motion.div
        className="absolute inset-0 rounded-full border-2"
        style={{ borderColor: `${hex300}4d` }}
        animate={
          reduceMotion
            ? undefined
            : { scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }
        }
        transition={{ duration: 1.8, repeat: Infinity }}
      />
      <motion.div
        className="absolute h-5 w-5 rounded-full blur-md"
        style={{ backgroundColor: hex300 }}
        animate={reduceMotion ? undefined : flicker}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="relative flex h-6 w-6 items-center justify-center rounded-full border"
        style={{
          borderColor: `${hex400}80`,
          background: `linear-gradient(to bottom right, ${hex700}, ${hex500})`,
          boxShadow: `0 0 12px -2px ${hex400}e6`,
        }}
      >
        <Globe2 className="h-3 w-3 text-[#04070a]" />
      </div>
    </div>
  );
}

export default function Navbar() {
  const reduceMotion = useReducedMotion();
  const { theme } = useColorTheme();
  const gridBg = useMemo(() => buildHudGridBackground(theme), [theme]);
  const { hex400, shades } = theme;

  return (
    <motion.nav
      className="relative grid grid-cols-3 items-center overflow-hidden border-b bg-white px-6 py-4 shadow-sm dark:bg-[#04070a]"
      style={{
        borderColor: `${hex400}26`,
        // dark mode glow
        boxShadow: undefined,
      }}
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* HUD background (dark mode) */}
      <div className="pointer-events-none absolute inset-0 hidden dark:block">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `url("${gridBg}")`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0a1219_0%,_#04070a_70%)]" />
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background: `linear-gradient(to right, transparent, ${hex400}66, transparent)`,
          }}
        />
        {[
          "-left-px -top-px border-l-2 border-t-2",
          "-right-px -top-px border-r-2 border-t-2",
          "-left-px -bottom-px border-l-2 border-b-2",
          "-right-px -bottom-px border-r-2 border-b-2",
        ].map((cls) => (
          <div
            key={cls}
            className={`absolute ${cls} h-3.5 w-3.5`}
            style={{ borderColor: `${hex400}73` }}
          />
        ))}
        {!reduceMotion && (
          <motion.div
            className="absolute top-0 bottom-0 w-px"
            style={{
              background: `linear-gradient(to bottom, transparent, ${shades[300]}59, transparent)`,
            }}
            animate={{ left: ["0%", "100%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      {/* Left — trigger */}
      <div className="relative z-10 justify-self-start">
        <SidebarTrigger className="text-slate-700 dark:text-stone-300 dark:hover:opacity-100" />
      </div>

      {/* Center — brand (hex-driven so theme is undeniable) */}
      <div className="relative z-10 justify-self-center">
        <Link href="/" className="flex items-center gap-6">
          <BrandMark
            hex400={hex400}
            hex300={shades[300]}
            hex500={shades[500]}
            hex600={shades[600]}
            hex700={shades[700]}
          />
          <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-slate-900 dark:text-stone-50">
            <span style={{ color: hex400 }}>GLOBE</span>
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
              className="text-slate-700 dark:text-stone-200"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button
              className="border text-[#04070a]"
              style={{
                borderColor: `${hex400}66`,
                backgroundColor: shades[500],
                boxShadow: `0 0 20px -6px ${hex400}99`,
              }}
            >
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
