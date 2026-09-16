// lib/colorThemes.ts
//
// Central registry of selectable accent color themes. Every place in the
// UI that used to hardcode "cyan" (HudPanel, Navbar, AppSidebar, the news
// pages, etc.) now reads its color from CSS variables --accent-300 through
// --accent-700, defined in app/globals.css and swapped via a
// data-accent="<id>" attribute on <html>. Tailwind v4 picks these up as
// the accent-300 .. accent-700 color classes automatically (see the
// @theme inline block in globals.css) — no tailwind.config.ts needed.
//
// To add a new theme: add an entry here AND a matching
// [data-accent="id"] block in globals.css with the same five shades.

export type ColorThemeId =
  | "cyan"
  | "violet"
  | "emerald"
  | "amber"
  | "rose"
  | "blue";

export interface ColorThemeShades {
  /** Hex values. Tailwind v4 supports opacity modifiers (e.g. bg-accent-400/50)
   *  natively on plain hex/oklch colors via color-mix(), so no special
   *  "R G B" triplet format is needed here (that was a v3 workaround). */
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
}

export interface ColorTheme {
  id: ColorThemeId;
  label: string;
  /** Solid swatch shown in the settings picker. */
  swatchHex: string;
  /** Hex for the "400" shade, used to tint the SVG HUD grid background. */
  hex400: string;
  shades: ColorThemeShades;
}

export const COLOR_THEMES: Record<ColorThemeId, ColorTheme> = {
  cyan: {
    id: "cyan",
    label: "Cyan",
    swatchHex: "#22d3ee",
    hex400: "#22d3ee",
    shades: {
      300: "#67e8f9",
      400: "#22d3ee",
      500: "#06b6d4",
      600: "#0891b2",
      700: "#0e7490",
    },
  },
  violet: {
    id: "violet",
    label: "Violet",
    swatchHex: "#a78bfa",
    hex400: "#a78bfa",
    shades: {
      300: "#c4b5fd",
      400: "#a78bfa",
      500: "#8b5cf6",
      600: "#7c3aed",
      700: "#6d28d9",
    },
  },
  emerald: {
    id: "emerald",
    label: "Emerald",
    swatchHex: "#34d399",
    hex400: "#34d399",
    shades: {
      300: "#6ee7b7",
      400: "#34d399",
      500: "#10b981",
      600: "#059669",
      700: "#047857",
    },
  },
  amber: {
    id: "amber",
    label: "Amber",
    swatchHex: "#fbbf24",
    hex400: "#fbbf24",
    shades: {
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
    },
  },
  rose: {
    id: "rose",
    label: "Rose",
    swatchHex: "#fb7185",
    hex400: "#fb7185",
    shades: {
      300: "#fda4af",
      400: "#fb7185",
      500: "#f43f5e",
      600: "#e11d48",
      700: "#be123c",
    },
  },
  blue: {
    id: "blue",
    label: "Blue",
    swatchHex: "#60a5fa",
    hex400: "#60a5fa",
    shades: {
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
    },
  },
};

export const COLOR_THEME_LIST: ColorTheme[] = Object.values(COLOR_THEMES);

export const DEFAULT_COLOR_THEME: ColorThemeId = "cyan";

export function isColorThemeId(value: string): value is ColorThemeId {
  return Object.prototype.hasOwnProperty.call(COLOR_THEMES, value);
}

/**
 * Rebuilds the dotted "HUD" grid background data URI used across the app
 * (originally a static const hardcoded to cyan), tinted with the given
 * theme's accent hex instead.
 */
export function buildHudGridBackground(theme: ColorTheme): string {
  const hex = theme.hex400.replace("#", "");
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cg stroke='%23${hex}' stroke-opacity='0.35' stroke-width='1'%3E%3Cpath d='M24 18v12M18 24h12'/%3E%3C/g%3E%3C/svg%3E`;
}
