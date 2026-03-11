"use client";

import { useEffect, useState } from "react";
import { ITEM_WIDTH_TABLET, GAP, MOBILE_GAP } from "./types";

const SIDEBAR_WIDTH = 32 + 12; // w-8 (32px) + mr-3 (12px)

interface Dims {
  isMobile: boolean;
  itemWidth: number;
  itemHeight: number;
  posterWidth: number;
  posterHeight: number;
  gap: number;
}

export function TrendingCarouselSkeleton() {
  const [dims, setDims] = useState<Dims | null>(null);

  useEffect(() => {
    const measure = () => {
      const isMobile = window.innerWidth < 768;
      const containerWidth = window.innerWidth - (isMobile ? 0 : 32);
      let itemWidth: number;
      if (isMobile) {
        itemWidth = (containerWidth - MOBILE_GAP * 2) / 3;
      } else {
        itemWidth = Math.min(ITEM_WIDTH_TABLET, containerWidth * 0.33);
      }
      const itemHeight = (itemWidth * 3) / 2;
      // On desktop the poster is narrower because sidebar takes space
      const posterWidth = isMobile ? itemWidth : itemWidth - SIDEBAR_WIDTH;
      const posterHeight = (posterWidth * 3) / 2;

      setDims({
        isMobile,
        itemWidth,
        itemHeight,
        posterWidth,
        posterHeight,
        gap: isMobile ? MOBILE_GAP : GAP,
      });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // SSR / pre-mount: pure CSS skeleton, hydration-safe
  if (!dims) {
    return (
      <section className="relative w-full px-4" aria-label="Trending skeleton">
        <div className="h-8 bg-light-border dark:bg-dark-border rounded w-1/4 mb-6 animate-pulse" />
        <div className="flex gap-6 pb-6 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-[30%] aspect-2/3 rounded-lg bg-light-border dark:bg-dark-border animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  const { isMobile, itemWidth, itemHeight, posterWidth, posterHeight, gap } = dims;

  return (
    <section
      className={`relative w-full ${isMobile ? "px-0" : "px-4"}`}
      aria-label="Trending skeleton"
    >
      <div className="h-8 bg-light-border dark:bg-dark-border rounded w-1/4 mb-6 animate-pulse" />

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
                  {/* Sidebar — desktop only, matches real CarouselItem sidebar */}
                  {!isMobile && (
                    <div
                      className="hidden md:flex flex-col justify-between mr-3 w-8"
                      style={{ height: `${posterHeight}px` }}
                    >
                      <div className="flex-1 flex justify-center pt-4">
                        <div className="w-4 h-20 bg-light-border dark:bg-dark-border rounded animate-pulse" />
                      </div>
                      <div className="h-12.5 flex items-center justify-center bg-light-border dark:bg-dark-border rounded animate-pulse">
                        <div className="w-6 h-6 bg-light-border dark:bg-dark-border rounded" />
                      </div>
                    </div>
                  )}

                  {/* Poster — matches real Link dimensions exactly */}
                  <div
                    className="relative rounded-lg overflow-hidden shadow-xl bg-light-border dark:bg-dark-border animate-pulse"
                    style={{ width: `${posterWidth}px`, height: `${posterHeight}px` }}
                  >
                    {/* Mobile rank badge */}
                    <div className="absolute top-0 left-0 z-10 md:hidden w-8 h-8 bg-light-border dark:bg-dark-border" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow buttons placeholder */}
        <div className="hidden md:flex flex-col gap-4 ml-2 shrink-0">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="w-14 bg-light-border dark:bg-dark-border rounded-md animate-pulse"
              style={{ height: `${(posterHeight - 16) / 2}px` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}