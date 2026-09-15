// app/components/SearchBar.tsx
"use client";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Reusable search input, styled to match HudPanel's cyan/dark theme. */
export function SearchBar({
  value,
  onChange,
  placeholder = "Search the archive...",
}: SearchBarProps) {
  return (
    <div className="relative mb-4">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400/50" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-cyan-400/20 bg-[#0a1219] py-2.5 pl-9 pr-9 text-sm text-cyan-50 outline-none placeholder:text-cyan-200/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-200/40 hover:text-cyan-200"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
