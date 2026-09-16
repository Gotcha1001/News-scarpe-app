// // app/components/HudPanel.tsx
// "use client";

// import { motion } from "framer-motion";
// import type { ReactNode } from "react";

// const GRID_BG =
//   "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cg stroke='%2322d3ee' stroke-opacity='0.35' stroke-width='1'%3E%3Cpath d='M24 18v12M18 24h12'/%3E%3C/g%3E%3C/svg%3E";

// const CORNERS = [
//   "-left-px -top-px border-l-2 border-t-2",
//   "-right-px -top-px border-r-2 border-t-2",
//   "-left-px -bottom-px border-l-2 border-b-2",
//   "-right-px -bottom-px border-r-2 border-b-2",
// ];

// interface HudPanelProps {
//   children: ReactNode;
//   className?: string;
//   /** Show the animated cyan scanline sweep down the panel. */
//   scanline?: boolean;
// }

// /** Shared dark/cyan "HUD" card used across every page — forms, lists, and
//  * detail views all sit inside one of these instead of a plain white/gray card. */
// export function HudPanel({
//   children,
//   className = "",
//   scanline = false,
// }: HudPanelProps) {
//   return (
//     <div
//       className={`relative overflow-hidden rounded-xl border border-cyan-400/25 bg-[#04070a] shadow-[0_0_60px_-18px_rgba(34,211,238,0.35)] ${className}`}
//     >
//       <div
//         className="pointer-events-none absolute inset-0 opacity-30"
//         style={{
//           backgroundImage: `url("${GRID_BG}")`,
//           backgroundSize: "48px 48px",
//         }}
//       />
//       <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0a1219_0%,_#04070a_75%)]" />
//       {CORNERS.map((cls) => (
//         <div
//           key={cls}
//           className={`pointer-events-none absolute ${cls} h-5 w-5 border-cyan-400/60`}
//         />
//       ))}
//       {scanline && (
//         <motion.div
//           className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent"
//           animate={{ top: ["0%", "100%"] }}
//           transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }}
//         />
//       )}
//       <div className="relative">{children}</div>
//     </div>
//   );
// }

// /** Small cyan section-label pill used above lists/sections. */
// export function HudLabel({ children }: { children: ReactNode }) {
//   return (
//     <p className="mb-3 font-[family-name:var(--font-hud)] text-xs uppercase tracking-[0.2em] text-cyan-300/70">
//       {children}
//     </p>
//   );
// }
// app/components/HudPanel.tsx
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useColorTheme } from "@/app/context/ColorThemeContext";
import { buildHudGridBackground } from "@/lib/colorThemes";

const CORNERS = [
  "-left-px -top-px border-l-2 border-t-2",
  "-right-px -top-px border-r-2 border-t-2",
  "-left-px -bottom-px border-l-2 border-b-2",
  "-right-px -bottom-px border-r-2 border-b-2",
];

interface HudPanelProps {
  children: ReactNode;
  className?: string;
  /** Show the animated accent-colored scanline sweep down the panel. */
  scanline?: boolean;
}

/** Shared dark/accent "HUD" card used across every page — forms, lists, and
 * detail views all sit inside one of these instead of a plain white/gray card. */
export function HudPanel({
  children,
  className = "",
  scanline = false,
}: HudPanelProps) {
  const { theme } = useColorTheme();
  // Regenerated per-theme since the SVG stroke color is baked into the data
  // URI at generation time — it can't just react to a CSS variable.
  const gridBg = useMemo(() => buildHudGridBackground(theme), [theme]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-accent-400/25 bg-[#04070a] shadow-[0_0_60px_-18px_color-mix(in_srgb,var(--accent-400)_35%,transparent)] ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("${gridBg}")`,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0a1219_0%,_#04070a_75%)]" />
      {CORNERS.map((cls) => (
        <div
          key={cls}
          className={`pointer-events-none absolute ${cls} h-5 w-5 border-accent-400/60`}
        />
      ))}
      {scanline && (
        <motion.div
          className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-300/50 to-transparent"
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

/** Small accent-colored section-label pill used above lists/sections. */
export function HudLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 font-[family-name:var(--font-hud)] text-xs uppercase tracking-[0.2em] text-accent-300/70">
      {children}
    </p>
  );
}
