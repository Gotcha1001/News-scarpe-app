// app/components/SearchBar.tsx
"use client";

import { Search, X } from "lucide-react";
import { useColorTheme } from "@/app/context/ColorThemeContext";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Reusable search input, styled to match the active accent theme. */
export function SearchBar({
  value,
  onChange,
  placeholder = "Search the archive...",
}: SearchBarProps) {
  const { theme } = useColorTheme();
  const { hex400, shades } = theme;

  return (
    <div className="relative mb-4">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
        style={{ color: `${hex400}80` }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border bg-[#0a1219] py-2.5 pl-9 pr-9 text-sm text-stone-50 outline-none transition-colors"
        style={{
          borderColor: `${hex400}33`,
          // placeholder color via CSS is limited; keep a neutral fallback
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = hex400;
          e.currentTarget.style.boxShadow = `0 0 0 2px ${hex400}33`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = `${hex400}33`;
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: `${shades[300]}66` }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = shades[300];
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = `${shades[300]}66`;
          }}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
