// "use client";

// import { useTheme } from "next-themes";
// import { Moon, Sun } from "lucide-react";
// import { Button } from "@/components/ui/button";

// export function ThemeToggle() {
//   const { theme, setTheme, systemTheme } = useTheme();

//   // Use systemTheme to determine current theme if theme is 'system'
//   const currentTheme = theme === "system" ? systemTheme : theme;
//   const isDark = currentTheme === "dark";

//   return (
//     <Button
//       variant="ghost"
//       size="icon"
//       onClick={() => setTheme(isDark ? "light" : "dark")}
//       className="text-black dark:text-white hover:bg-blue-700"
//       title={isDark ? "Switch to light mode" : "Switch to dark mode"}
//     >
//       {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
//       <span className="sr-only">
//         {isDark ? "Switch to light mode" : "Switch to dark mode"}
//       </span>
//     </Button>
//   );
// }
"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/** SSR-safe "am I on the client?" — no useEffect / setState. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const isClient = useIsClient();

  // Neutral placeholder on the server (and first paint) so SSR HTML
  // matches the first client render. Real icon appears after hydrate.
  if (!isClient) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="text-black dark:text-white"
        aria-hidden
        disabled
      >
        <span className="h-5 w-5" />
      </Button>
    );
  }

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="text-black dark:text-white hover:bg-accent-400/20"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      <span className="sr-only">
        {isDark ? "Switch to light mode" : "Switch to dark mode"}
      </span>
    </Button>
  );
}
