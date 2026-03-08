"use client";

import { useEffect, useRef, useState } from "react";
import { useResponsiveConfig, useCarousel, useCarouselDimensions, useTrendingMedia } from "./SubComps/hooks";
import { TrendingCarouselSkeleton } from "./SubComps/Skeleton";
import { CarouselItem } from "./SubComps/CarouselItem";
import { NavigationButtons } from "./SubComps/NavigationButtons";
import { ErrorState } from "./SubComps/ErrorState";
import { EmptyState } from "./SubComps/EmptyState";
import { MOBILE_GAP, GAP } from "./SubComps/types";

const SWIPE_THRESHOLD = 50;

export default function TrendingCarouselClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Live drag offset — updated every touchmove for instant feedback
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontal = useRef<boolean | null>(null); // locked once direction known

  const { isMobile, isTablet, isDesktop, isClient } = useResponsiveConfig();
  const { media, loading, error } = useTrendingMedia();
  const { visibleCount, itemWidth } = useCarouselDimensions(containerRef);
  const { index, scrollLeft, scrollRight, canGoLeft, canGoRight, isReady } =
    useCarousel(media.length, visibleCount);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!carouselRef.current?.contains(document.activeElement)) return;
      if (e.key === "ArrowLeft") scrollLeft();
      else if (e.key === "ArrowRight") scrollRight();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [scrollLeft, scrollRight]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Lock direction on first significant movement
    if (isHorizontal.current === null) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      isHorizontal.current = Math.abs(dx) > Math.abs(dy);
    }

    if (!isHorizontal.current) return; // vertical scroll — don't interfere

    e.preventDefault(); // prevent page scroll while swiping horizontally
    setIsDragging(true);
    setDragOffset(dx);
  };

  const onTouchEnd = () => {
    if (!isHorizontal.current) return;

    if (dragOffset < -SWIPE_THRESHOLD) scrollRight();
    else if (dragOffset > SWIPE_THRESHOLD) scrollLeft();

    // Reset drag state — transition takes over for snap
    setDragOffset(0);
    setIsDragging(false);
    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontal.current = null;
  };

  if (error) return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  if (!loading && isClient && !media.length) return <EmptyState />;

  const isReady2Render = !loading && isClient && itemWidth > 0 && media.length > 0;
  const itemHeight = itemWidth > 0 ? (itemWidth * 3) / 2 : 0;
  const gap = isMobile ? MOBILE_GAP : GAP;

  // Base translate from carousel index
  const baseTranslate = -index * (itemWidth + gap);
  // While dragging: no transition, add live finger offset
  // After drag ends: smooth transition snaps to index position
  const translateX = baseTranslate + (isDragging ? dragOffset : 0);

  return (
    <>
      {!isReady2Render && <TrendingCarouselSkeleton />}

      <section
        className={`relative w-full ${isMobile ? "px-0" : "px-4"} ${!isReady2Render ? "invisible absolute" : ""}`}
        ref={carouselRef}
        aria-label="Trending media carousel"
      >
        <h2 className="text-2xl font-bold mb-6 px-4">Trending</h2>

        <div className="flex w-full items-start" ref={containerRef}>
          <div className="relative overflow-hidden flex-1">
            <div
              className="flex pb-6 pr-5"
              style={{
                gap: `${gap}px`,
                transform: `translateX(${translateX}px)`,
                // No transition while finger is down — instant tracking
                // Smooth snap animation when finger lifts
                transition: isDragging ? "none" : "transform 500ms ease-out",
                // Prevent text/image selection during drag
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {isReady2Render && media.map((item, idx) => (
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
    </>
  );
}