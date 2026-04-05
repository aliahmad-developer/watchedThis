"use client";

import { useLayoutEffect, useState } from "react";
import { ITEM_WIDTH_TABLET, GAP, MOBILE_GAP, SIDEBAR_WIDTH } from "./types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

interface Dims {
  isMobile: boolean;
  itemWidth: number;
  posterWidth: number;
  posterHeight: number;
  gap: number;
  count: number;
}

interface TrendingCarouselSkeletonProps {
  itemWidth?: number;
}

function measure(forcedItemWidth?: number): Dims {
  const isMobile = window.innerWidth < 768;
  const containerWidth = window.innerWidth - (isMobile ? 24 : 32);
  const gap = isMobile ? MOBILE_GAP : GAP;
  const count = isMobile ? 3 : 4;

  const itemWidth =
    forcedItemWidth ??
    (isMobile
      ? (containerWidth - gap * (count - 1)) / count
      : Math.min(ITEM_WIDTH_TABLET, containerWidth * 0.33));

  const posterWidth = isMobile ? itemWidth : itemWidth - SIDEBAR_WIDTH;
  const posterHeight = (posterWidth * 3) / 2;

  return { isMobile, itemWidth, posterWidth, posterHeight, gap, count };
}

function SkeletonCard({ dims }: { dims: Dims }) {
  const { isMobile, itemWidth, posterWidth, posterHeight } = dims;
  return (
    <div className="flex shrink-0" style={{ width: `${itemWidth}px` }}>
      {!isMobile && (
        <div
          className="hidden md:flex flex-col justify-between mr-3 w-8"
          style={{ height: `${posterHeight}px` }}
        >
          <div className="flex-1 flex justify-center pt-4">
            <div className="w-3 h-16 bg-light-border dark:bg-dark-border rounded-full animate-pulse" />
          </div>
          <div className="h-12 flex items-center justify-center">
            <div className="w-5 h-5 bg-light-border dark:bg-dark-border rounded animate-pulse" />
          </div>
        </div>
      )}
      <div
        className="rounded-lg bg-light-border dark:bg-dark-border animate-pulse shrink-0"
        style={{ width: `${posterWidth}px`, height: `${posterHeight}px` }}
      />
    </div>
  );
}

function SkeletonNavButton() {
  return (
    <div className="w-10 h-10 rounded-full bg-light-border dark:bg-dark-border animate-pulse" />
  );
}

export function TrendingCarouselSkeleton({
  itemWidth: forcedItemWidth,
}: TrendingCarouselSkeletonProps) {
  // null = SSR / pre-layout — renders nothing visible to avoid any flash
  const [dims, setDims] = useState<Dims | null>(null);

  // useLayoutEffect fires before paint — no frame with wrong dimensions
  useLayoutEffect(() => {
    setDims(measure(forcedItemWidth));

    if (forcedItemWidth) return;
    const onResize = () => setDims(measure());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [forcedItemWidth]);

  // SSR / pre-layout: invisible size-matched placeholder so layout doesn't shift
  if (!dims) {
    return (
      <section className="relative w-full px-4" aria-hidden="true">
        <div className="h-8 rounded w-1/4 mb-6" />
        <div className="flex gap-6 pb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[30%] aspect-[2/3]" />
          ))}
        </div>
      </section>
    );
  }

  const { isMobile, posterHeight, gap, count } = dims;

  return (
    <section
      className={`relative w-full ${isMobile ? "px-3" : "px-4"}`}
      aria-label="Loading trending"
    >
      <div className="flex items-center justify-between gap-2 mb-6 px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-light-border dark:bg-dark-border animate-pulse" />
          <div className="h-6 w-24 rounded bg-light-border dark:bg-dark-border animate-pulse" />
        </div>
        {isMobile && (
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-light-border dark:bg-dark-border animate-pulse" />
            <div className="w-4 h-4 rounded bg-light-border dark:bg-dark-border animate-pulse" />
          </div>
        )}
      </div>

      <div className="flex w-full items-start">
        {/* Track */}
        <div className="relative overflow-hidden flex-1">
          <div className="flex pb-6 pr-5" style={{ gap: `${gap}px` }}>
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonCard key={i} dims={dims} />
            ))}
          </div>
        </div>

        {/* Desktop nav */}
        {!isMobile && (
          <div className="hidden md:flex flex-col gap-3 ml-2 shrink-0">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="w-10 rounded-xl bg-light-border dark:bg-dark-border animate-pulse"
                style={{ height: `${(posterHeight - 12) / 2}px` }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
