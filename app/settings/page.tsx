// app/settings/page.tsx
"use client";

import { Check, Loader2 } from "lucide-react";
import { HudPanel, HudLabel } from "../components/HudPanel";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { useColorTheme } from "@/app/context/ColorThemeContext";
import { COLOR_THEME_LIST, type ColorThemeId } from "@/lib/colorThemes";

export default function SettingsPage() {
  const { themeId, setThemeId, isSaving } = useColorTheme();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-accent-50">
          Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-accent-200/50">
          Personalize how the app looks for you.
        </p>
      </div>

      <HudPanel className="p-6">
        <div className="flex items-center justify-between">
          <HudLabel>Accent Color</HudLabel>
          {isSaving && (
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-accent-300/60">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving
            </span>
          )}
        </div>
        <p className="mb-4 text-sm text-slate-500 dark:text-accent-200/50">
          Pick the accent used across the HUD, sidebar, and cards. Signed-in
          choices sync to every device; signed-out choices stay on this browser.
        </p>
        <div
          role="radiogroup"
          aria-label="Accent color"
          className="grid grid-cols-3 gap-3 sm:grid-cols-6"
        >
          {COLOR_THEME_LIST.map((theme) => (
            <ColorSwatchButton
              key={theme.id}
              themeId={theme.id}
              label={theme.label}
              swatchHex={theme.swatchHex}
              selected={themeId === theme.id}
              onSelect={setThemeId}
            />
          ))}
        </div>
      </HudPanel>

      <HudPanel className="p-6">
        <HudLabel>Appearance</HudLabel>
        <p className="mb-4 text-sm text-slate-500 dark:text-accent-200/50">
          Switch between light and dark mode.
        </p>
        <ThemeToggle />
      </HudPanel>
    </div>
  );
}

function ColorSwatchButton({
  themeId,
  label,
  swatchHex,
  selected,
  onSelect,
}: {
  themeId: ColorThemeId;
  label: string;
  swatchHex: string;
  selected: boolean;
  onSelect: (id: ColorThemeId) => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(themeId)}
      className={`group flex flex-col items-center gap-2 rounded-lg border p-3 transition ${
        selected
          ? "border-accent-400/60 bg-accent-400/10 shadow-[0_0_20px_-6px_rgba(0,0,0,0.3)]"
          : "border-transparent hover:border-accent-400/25 hover:bg-accent-400/5"
      }`}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 shadow-inner"
        style={{ backgroundColor: swatchHex }}
      >
        {selected && (
          <Check className="h-4 w-4 text-black/70" strokeWidth={3} />
        )}
      </span>
      <span className="text-[11px] font-medium text-slate-600 dark:text-accent-100/70">
        {label}
      </span>
    </button>
  );
}
