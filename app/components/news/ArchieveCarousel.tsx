// app/components/news/ArchiveCarousel.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import { Newspaper } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { HudPanel } from "@/app/components/HudPanel";
import type { ArchiveCarouselItem } from "@/types/news";

const SLIDE_BASIS = "basis-[85%] sm:basis-1/2 lg:basis-1/3";

function formatShortDate(timestampMs: number): string {
  return new Date(timestampMs).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Home-page carousel of past headlines (picture + title) pulled from the
 * saved digests. Every slide opens the digest it came from. Renders nothing
 * when there's no archive yet, so a brand-new install has no empty section.
 */
export function ArchiveCarousel() {
  const items = useQuery(api.news.getArchiveCarousel, {});
  const reduceMotion = useReducedMotion();

  // Auto-advance is a non-essential motion, so it's skipped entirely for
  // people who ask their OS for reduced motion. It pauses while hovered.
  const plugins = useMemo(
    () =>
      reduceMotion
        ? []
        : [
            Autoplay({
              delay: 4500,
              stopOnMouseEnter: true,
              stopOnInteraction: false,
            }),
          ],
    [reduceMotion],
  );

  if (items === undefined) return <ArchiveCarouselSkeleton />;
  if (items.length === 0) return null;

  return (
    <section className="relative mx-auto max-w-5xl px-6 pb-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-stone-100">
            Past headlines
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            Stories from earlier digests. Pick one to open that day&apos;s full
            run.
          </p>
        </div>
        <Link
          href="/archive"
          className="shrink-0 rounded-sm text-sm text-accent-300 transition-colors hover:text-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        >
          View full archive
        </Link>
      </div>

      <Carousel
        opts={{ align: "start", loop: items.length > 3 }}
        plugins={plugins}
        aria-label="Past headlines from the news archive"
      >
        {/* py-4 keeps each panel's outer glow from being clipped by the
            carousel viewport's overflow-hidden. */}
        <CarouselContent className="py-4">
          {items.map((item) => (
            <CarouselItem key={item.articleId} className={SLIDE_BASIS}>
              <ArchiveSlide item={item} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-3 hidden border-accent-400/40 bg-[#04070a]/90 text-accent-300 hover:bg-accent-400/15 hover:text-accent-300 sm:flex" />
        <CarouselNext className="-right-3 hidden border-accent-400/40 bg-[#04070a]/90 text-accent-300 hover:bg-accent-400/15 hover:text-accent-300 sm:flex" />
      </Carousel>
    </section>
  );
}

function ArchiveSlide({ item }: { item: ArchiveCarouselItem }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link
      href={`/news/${item.runId}`}
      className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
    >
      <HudPanel className="flex h-full flex-col transition-colors duration-200 group-hover:border-accent-400/60">
        <div className="relative h-40 w-full overflow-hidden border-b border-accent-400/15 bg-[#0a1219]">
          {imageFailed ? (
            <div className="flex h-full w-full items-center justify-center text-stone-600">
              <Newspaper className="h-8 w-8" aria-hidden="true" />
            </div>
          ) : (
            // Remote hero images come from arbitrary publisher domains, so a
            // plain <img> is used (same as ArticleCard). no-referrer avoids
            // most hotlink-protection rejections; onError swaps in a
            // placeholder if one still fails.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover opacity-90 transition-opacity duration-200 group-hover:opacity-100"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#04070a] via-transparent to-transparent" />
          <span className="absolute left-3 top-3 rounded-full border border-accent-400/30 bg-accent-400/10 px-2.5 py-1 font-[family-name:var(--font-hud)] text-[10px] font-semibold uppercase tracking-[0.15em] text-accent-300 backdrop-blur-sm">
            {formatShortDate(item.runDate)}
          </span>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <h3 className="line-clamp-3 min-h-[4.125rem] font-[family-name:var(--font-display)] text-base font-semibold leading-snug text-stone-50 transition-colors duration-200 group-hover:text-accent-400">
            {item.title}
          </h3>
          <div className="flex items-center justify-between gap-3 font-[family-name:var(--font-hud)] text-[11px] uppercase tracking-[0.15em]">
            <span className="truncate text-stone-500">
              {item.source ?? "Source"}
            </span>
            <span className="shrink-0 text-accent-300">Open digest</span>
          </div>
        </div>
      </HudPanel>
    </Link>
  );
}

function ArchiveCarouselSkeleton() {
  return (
    <section
      className="relative mx-auto max-w-5xl px-6 pb-12"
      aria-busy="true"
      aria-label="Loading past headlines"
    >
      <div className="flex gap-4 overflow-hidden py-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-[17.5rem] shrink-0 rounded-xl border border-accent-400/20 bg-[#060b0f]/80 motion-safe:animate-pulse ${SLIDE_BASIS}`}
          />
        ))}
      </div>
    </section>
  );
}
