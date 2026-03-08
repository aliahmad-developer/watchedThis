"use client";

import { useEffect, useState } from "react";
import { ITEM_WIDTH_TABLET, GAP, MOBILE_GAP } from "./types";

interface Dims {
  isMobile: boolean;
  itemWidth: number;
  itemHeight: number;
  gap: number;
}

export function TrendingCarouselSkeleton() {
  // null on SSR and first render — both server and client agree, no mismatch
  const [dims, setDims] = useState<Dims | null>(null);

  useEffect(() => {
    const measure = () => {
      const isMobile = window.innerWidth < 768;
      // Use the same logic as useCarouselDimensions for consistency
      const containerWidth = window.innerWidth - (isMobile ? 0 : 32); // account for px-4
      let itemWidth: number;
      if (isMobile) {
        itemWidth = (containerWidth - MOBILE_GAP * 2) / 3;
      } else {
        itemWidth = Math.min(ITEM_WIDTH_TABLET, containerWidth * 0.33);
      }
      setDims({
        isMobile,
        itemWidth,
        itemHeight: (itemWidth * 3) / 2,
        gap: isMobile ? MOBILE_GAP : GAP,
      });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // SSR / pre-mount: pure CSS skeleton, no pixel values, hydration-safe
  if (!dims) {
    return (
      <section className="relative w-full px-4" aria-label="Trending skeleton">
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-6 animate-pulse" />
        <div className="flex gap-6 pb-6 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-[30%] aspect-2/3 rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  const { isMobile, itemWidth, itemHeight, gap } = dims;

  return (
    <section
      className={`relative w-full ${isMobile ? "px-0" : "px-4"}`}
      aria-label="Trending skeleton"
    >
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-6 animate-pulse" />

      <div className="flex w-full items-start">
        <div className="relative overflow-hidden flex-1">
          <div className="flex pb-6 pr-5" style={{ gap: `${gap}px` }}>
            {Array.from({ length: isMobile ? 3 : 4 }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col shrink-0"
                style={{ width: `${itemWidth}px` }}
              >
                <div className="flex">
                  <div
                    className="hidden md:flex flex-col justify-between mr-3 w-8"
                    style={{ height: `${itemHeight}px` }}
                  >
                    <div className="flex-1 flex justify-center pt-4">
                      <div className="w-4 h-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    </div>
                    <div className="h-12.5 bg-gray-400 dark:bg-gray-600 rounded animate-pulse">
                      <div className="w-6 h-6 bg-gray-300 dark:bg-gray-500 rounded" />
                    </div>
                  </div>
                  <div
                    className="relative rounded-lg overflow-hidden shadow-xl bg-gray-300 dark:bg-gray-700 animate-pulse"
                    style={{ width: `${itemWidth}px`, height: `${itemHeight}px` }}
                  >
                    <div className="absolute top-3 left-3 z-10 md:hidden w-8 h-8 bg-gray-400 dark:bg-gray-600 rounded-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-4 ml-2 shrink-0">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="w-14 bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse"
              style={{ height: `${(itemHeight - 16) / 2}px` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}