"use client";

import { useEffect, useRef } from "react";
import { useResponsiveConfig, useCarousel, useCarouselDimensions, useTrendingMedia } from "./SubComps/hooks";
import { TrendingCarouselSkeleton } from "./SubComps/Skeleton";
import { CarouselItem } from "./SubComps/CarouselItem";
import { NavigationButtons } from "./SubComps/NavigationButtons";
import { ErrorState } from "./SubComps/ErrorState";
import { EmptyState } from "./SubComps/EmptyState";
import { MOBILE_GAP, GAP } from "./SubComps/types";

export default function TrendingCarouselClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const { isMobile, isTablet, isDesktop, isClient } = useResponsiveConfig();
  const { media, loading, error } = useTrendingMedia();
  const { visibleCount, itemWidth } = useCarouselDimensions(containerRef);
  const { index, scrollLeft, scrollRight, canGoLeft, canGoRight, isReady } =
    useCarousel(media.length, visibleCount);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!carouselRef.current?.contains(document.activeElement)) return;
      if (e.key === "ArrowLeft") scrollLeft();
      else if (e.key === "ArrowRight") scrollRight();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [scrollLeft, scrollRight]);

  if (loading) {
    return <TrendingCarouselSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  if (!media.length) {
    return <EmptyState />;
  }

  if (!isClient) {
    return <TrendingCarouselSkeleton />;
  }

  const itemHeight = (itemWidth * 3) / 2;
  const gap = isMobile ? MOBILE_GAP : GAP;

  return (
    <section
      className={`relative w-full ${isMobile ? "px-0" : "px-4"}`}
      ref={carouselRef}
      aria-label="Trending media carousel"
    >
      <h2 className="text-2xl font-bold mb-6 px-4">Trending</h2>

      <div className="flex w-full items-start" ref={containerRef}>
        <div className="relative overflow-hidden flex-1">
          <div
            className="flex pb-6 pr-5 transition-transform duration-500 ease-out"
            style={{
              gap: `${gap}px`,
              transform: `translateX(calc(-${index} * (${itemWidth}px + ${gap}px)))`,
            }}
          >
            {media.map((item, idx) => (
              <CarouselItem
                key={`${item.id}-${idx}`}
                item={item}
                position={idx + 1}
                isPriority={idx < visibleCount}
                itemWidth={itemWidth}
                showSidebar={!isMobile}
              />
            ))}
          </div>
        </div>

        {isReady && (isTablet || isDesktop) && (
          <NavigationButtons
            onLeft={scrollLeft}
            onRight={scrollRight}
            canGoLeft={canGoLeft}
            canGoRight={canGoRight}
            itemHeight={itemHeight}
          />
        )}
      </div>
    </section>
  );
}