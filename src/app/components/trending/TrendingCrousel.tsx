"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  useResponsiveConfig,
  useCarousel,
  useCarouselDimensions,
  useTrendingMedia,
} from "./SubComps/hooks";
import { TrendingCarouselSkeleton } from "./SubComps/Skeleton";
import { CarouselItem } from "./SubComps/CarouselItem";
import { NavigationButtons } from "./SubComps/NavigationButtons";
import { ErrorState } from "./SubComps/ErrorState";
import { EmptyState } from "./SubComps/EmptyState";
import { MOBILE_GAP, GAP } from "./SubComps/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHashtag,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const SWIPE_THRESHOLD = 50;

// ── Mobile nav button ─────────────────────────────────────────────────────────
function MobileNavButton({
  onClick,
  disabled,
  direction,
}: {
  onClick: () => void;
  disabled: boolean;
  direction: "left" | "right";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Previous" : "Next"}
      className={`
        relative w-11 h-11 rounded-full flex items-center justify-center
        border transition-all duration-200 select-none
        ${
          disabled
            ? "opacity-25 cursor-not-allowed border-light-border dark:border-dark-border bg-transparent"
            : `cursor-pointer
             border-light-border dark:border-dark-border
             bg-light-card dark:bg-dark-card
             text-light-secondary-text dark:text-dark-secondary-text
             hover:border-color-accent hover:text-color-accent
             hover:bg-light-bg dark:hover:bg-dark-bg
             hover:scale-110 active:scale-95 shadow-sm hover:shadow-md`
        }
      `}
    >
      <FontAwesomeIcon
        icon={direction === "left" ? faChevronLeft : faChevronRight}
        className="w-3.5 h-3.5"
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function TrendingCarouselClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontal = useRef<boolean | null>(null);

  const { isMobile, isTablet, isDesktop, isClient } = useResponsiveConfig();
  const { media, loading, error } = useTrendingMedia();
  const { visibleCount, itemWidth } = useCarouselDimensions(containerRef);
  const { index, scrollLeft, scrollRight, canGoLeft, canGoRight, isReady } =
    useCarousel(media.length, visibleCount);

  // ── Keyboard nav ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!carouselRef.current?.contains(document.activeElement)) return;
      if (e.key === "ArrowLeft") scrollLeft();
      else if (e.key === "ArrowRight") scrollRight();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [scrollLeft, scrollRight]);

  // ── Touch handlers ────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    setIsDragging(false);
    setDragOffset(0);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (isHorizontal.current === null) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      isHorizontal.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!isHorizontal.current) return;

    e.preventDefault();
    setIsDragging(true);
    setDragOffset(dx);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isHorizontal.current) return;
    if (dragOffset < -SWIPE_THRESHOLD) scrollRight();
    else if (dragOffset > SWIPE_THRESHOLD) scrollLeft();
    setDragOffset(0);
    setIsDragging(false);
    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontal.current = null;
  }, [dragOffset, scrollLeft, scrollRight]);

  // ── Derived layout ────────────────────────────────────────────────────────
  const { itemHeight, trackStyle } = useMemo(() => {
    const gap = isMobile ? MOBILE_GAP : GAP;
    const posterWidth = isMobile ? itemWidth : itemWidth - 44;
    const itemHeight = posterWidth > 0 ? (posterWidth * 3) / 2 : 0;
    const translateX =
      -index * (itemWidth + gap) + (isDragging ? dragOffset : 0);
    const trackStyle: React.CSSProperties = {
      gap: `${gap}px`,
      transform: `translateX(${translateX}px)`,
      transition: isDragging ? "none" : "transform 500ms ease-out",
      userSelect: "none",
      WebkitUserSelect: "none",
    };
    return { itemHeight, trackStyle };
  }, [isMobile, itemWidth, index, isDragging, dragOffset]);

  const isReady2Render =
    !loading && isClient && itemWidth > 0 && media.length > 0;

  // ── Early returns ─────────────────────────────────────────────────────────
  if (error)
    return (
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    );
  if (!loading && isClient && !media.length) return <EmptyState />;

  return (
    <>
      {!isReady2Render && (
        <TrendingCarouselSkeleton
          itemWidth={itemWidth > 0 ? itemWidth : undefined}
        />
      )}

      <section
        className={`
          relative w-full
          ${isMobile ? "px-3" : "px-4"}
          ${!isReady2Render ? "invisible absolute" : ""}
        `}
        ref={carouselRef}
        aria-label="Trending media carousel"
      >
        {/* Header */}
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-6 px-1">
          {/* Left — title */}
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faHashtag}
              className="text-light-accent dark:text-dark-accent ml-1"
              style={{ width: "1.5rem", height: "1.5rem" }}
            />
            <h2>Trending</h2>
          </div>

          {/* Right — mobile nav arrows (inline, no background) */}
          {isMobile && isReady && (
            <div className="flex items-center gap-3">
              <button
                onClick={scrollLeft}
                disabled={!canGoLeft}
                aria-label="Previous"
                className="bg-transparent p-1 text-light-secondary-text dark:text-dark-secondary-text
          hover:text-color-accent disabled:opacity-25 disabled:cursor-not-allowed
          transition-colors duration-150"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={scrollRight}
                disabled={!canGoRight}
                aria-label="Next"
                className="bg-transparent p-1 text-light-secondary-text dark:text-dark-secondary-text
          hover:text-color-accent disabled:opacity-25 disabled:cursor-not-allowed
          transition-colors duration-150"
              >
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="w-3.5 h-3.5"
                />
              </button>
            </div>
          )}
        </div>

        <div className="flex w-full items-start" ref={containerRef}>
          {/* Track */}
          <div className="relative overflow-hidden flex-1">
            <div
              className="flex pb-6 pr-5"
              style={trackStyle}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {isReady2Render &&
                media.map((item, idx) => (
                  <CarouselItem
                    key={item.id}
                    item={item}
                    position={idx + 1}
                    isPriority={idx < visibleCount}
                    itemWidth={itemWidth}
                    showSidebar={!isMobile}
                  />
                ))}
            </div>
          </div>

          {/* Desktop nav */}
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
