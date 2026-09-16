// app/components/Appsidebar.tsx
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Newspaper, Archive, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { useColorTheme } from "@/app/context/ColorThemeContext";
import { buildHudGridBackground } from "@/lib/colorThemes";

const NAV_ITEMS = [
  { href: "/news", label: "Today's News", icon: Newspaper },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/settings", label: "Settings", icon: Settings },
];

const flicker = {
  opacity: [0.55, 0.9, 0.5, 1, 0.6, 0.85, 0.55],
  scale: [0.95, 1.05, 0.92, 1.1, 0.97, 1.04, 0.95],
};

function SidebarBrandMark({
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
    <div className="relative flex size-8 shrink-0 items-center justify-center">
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
        className="absolute h-4 w-4 rounded-full blur-md"
        style={{ backgroundColor: hex300 }}
        animate={reduceMotion ? undefined : flicker}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="relative flex size-5 items-center justify-center rounded-full border text-[11px]"
        style={{
          borderColor: `${hex400}80`,
          background: `linear-gradient(to bottom right, ${hex700}, ${hex500})`,
          boxShadow: `0 0 12px -2px ${hex400}e6`,
        }}
      >
        🌐
      </div>
    </div>
  );
}

export function AppSidebar() {
  const { user } = useUser();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { theme } = useColorTheme();
  const gridBg = useMemo(() => buildHudGridBackground(theme), [theme]);
  const { hex400, shades } = theme;

  return (
    <Sidebar
      collapsible="icon"
      className="relative overflow-hidden border-slate-200 bg-white text-slate-900 dark:bg-[#04070a] dark:text-stone-50"
      style={
        {
          // dark border + glow driven by theme
          ["--sidebar-border" as string]: undefined,
        } as React.CSSProperties
      }
    >
      {/* HUD background layers (dark mode) */}
      <div className="pointer-events-none absolute inset-0 hidden dark:block">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("${gridBg}")`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0a1219_0%,_#04070a_75%)]" />
        <div
          className="absolute inset-y-0 right-0 w-px"
          style={{
            background: `linear-gradient(to bottom, transparent, ${hex400}66, transparent)`,
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
            className={`absolute ${cls} h-4 w-4`}
            style={{ borderColor: `${hex400}80` }}
          />
        ))}
        {!reduceMotion && (
          <motion.div
            className="absolute left-0 right-0 h-px"
            style={{
              background: `linear-gradient(to right, transparent, ${shades[300]}66, transparent)`,
            }}
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      {/* content */}
      <div className="relative z-10 flex h-full flex-col">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground dark:hover:bg-white/5"
              >
                <Link href="/">
                  <SidebarBrandMark
                    hex400={hex400}
                    hex300={shades[300]}
                    hex500={shades[500]}
                    hex600={shades[600]}
                    hex700={shades[700]}
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-black tracking-tight">
                      <span style={{ color: hex400 }}>GLOBE</span>
                      <span className="text-slate-700 dark:text-stone-300">
                        WIRE
                      </span>
                    </span>
                    <span className="truncate text-[10px] text-slate-500 dark:text-stone-400">
                      Today&apos;s news, decoded
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-slate-400 dark:text-stone-500 group-data-[collapsible=icon]:hidden">
              Navigation
            </SidebarGroupLabel>
            <SidebarMenu>
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={label}
                      className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-stone-50 data-[active=true]:bg-slate-100 data-[active=true]:text-slate-900 dark:data-[active=true]:bg-white/10 dark:data-[active=true]:text-stone-50"
                      style={
                        isActive
                          ? {
                              boxShadow: `0 0 12px -2px ${hex400}80`,
                              backgroundColor: `${hex400}26`,
                            }
                          : undefined
                      }
                    >
                      <Link href={href}>
                        <Icon
                          size={16}
                          style={isActive ? { color: hex400 } : undefined}
                        />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          {user && (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  className="dark:hover:bg-white/5 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="relative flex aspect-square size-8 items-center justify-center">
                    <div
                      className="flex size-7 items-center justify-center rounded-full border text-sm"
                      style={{
                        borderColor: `${hex400}4d`,
                        backgroundColor: `${shades[500]}26`,
                        boxShadow: `0 0 10px -2px ${hex400}80`,
                      }}
                    >
                      📰
                    </div>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-xs font-semibold text-slate-900 dark:text-stone-50">
                      {user.fullName ?? user.username}
                    </span>
                    <span className="truncate text-[10px] text-slate-500 dark:text-stone-400">
                      {user.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
