"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MediaItem {
  id: string;
  poster_path?: string;
  title?: string;
  name?: string;
}

const GAP = 24;
const MOBILE_GAP = 12;
const ITEM_WIDTH_DESKTOP = 260;
const ITEM_WIDTH_TABLET = 220;

// Custom hook for window dimensions and responsive calculations
function useResponsiveConfig() {
  const [windowWidth, setWindowWidth] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const updateWidth = () => setWindowWidth(window.innerWidth);

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  return { windowWidth, isMobile, isTablet, isDesktop, isClient };
}

// Custom hook for carousel logic
function useCarousel(mediaLength: number, visibleCount: number) {
  const [index, setIndex] = useState(0);
  const maxIndexRef = useRef(0);

  // Add a state to track if calculations are ready
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (mediaLength > 0 && visibleCount > 0) {
      const newMaxIndex = Math.max(0, mediaLength - visibleCount);
      maxIndexRef.current = newMaxIndex;

      // Reset index to 0 when dimensions change
      setIndex(0);
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [mediaLength, visibleCount]);

  const scrollLeft = useCallback(() => {
    if (isReady) {
      setIndex((prev) => Math.max(0, prev - 1));
    }
  }, [isReady]);

  const scrollRight = useCallback(() => {
    if (isReady) {
      setIndex((prev) => Math.min(maxIndexRef.current, prev + 1));
    }
  }, [isReady]);

  const canGoLeft = isReady && index > 0;
  const canGoRight = isReady && index < maxIndexRef.current;

  return {
    index,
    setIndex,
    scrollLeft,
    scrollRight,
    canGoLeft,
    canGoRight,
    maxIndex: maxIndexRef.current,
    isReady, // Export this state
  };
}

// Custom hook for carousel dimensions
function useCarouselDimensions(
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  const [dimensions, setDimensions] = useState({
    visibleCount: 4,
    itemWidth: 260,
  });
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    let calculatedItemWidth: number;
    let newCount: number;

    if (containerWidth < 768) {
      // Mobile: 3 items
      newCount = 3;
      calculatedItemWidth = (containerWidth - MOBILE_GAP * 2) / 3;
    } else if (containerWidth >= 768 && containerWidth < 1024) {
      // Tablet
      calculatedItemWidth = Math.min(ITEM_WIDTH_TABLET, containerWidth * 0.33);
      newCount = Math.max(
        1,
        Math.floor((containerWidth + GAP) / (calculatedItemWidth + GAP))
      );
    } else {
      // Desktop
      calculatedItemWidth = Math.min(ITEM_WIDTH_DESKTOP, containerWidth * 0.4);
      newCount = Math.max(
        1,
        Math.floor((containerWidth + GAP) / (calculatedItemWidth + GAP))
      );
    }

    setDimensions({ visibleCount: newCount, itemWidth: calculatedItemWidth });
  }, [containerRef]);

  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(updateDimensions, 150);
    };

    // Initial calculation
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener("resize", handleResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, [updateDimensions, containerRef]);

  return dimensions;
}

// Simple Skeleton component that avoids hydration issues
// Corrected Skeleton
function TrendingCarouselSkeleton() {
  return (
    <section className="relative w-full px-4" aria-label="Trending skeleton">
      {/* Heading */}
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-6 animate-pulse"></div>

      <div className="flex w-full items-start">
        {/* Carousel container */}
        <div className="relative overflow-hidden flex-1">
          <div className="flex gap-6 pb-6 pr-5">
            {Array.from({ length: 5 }).map((_, idx) => {
              const itemHeight = (ITEM_WIDTH_TABLET * 3) / 2;

              return (
                <div
                  key={idx}
                  className="flex flex-col flex-shrink-0"
                  style={{ width: `${ITEM_WIDTH_TABLET}px` }}
                >
                  <div className="flex">
                    {/* Sidebar skeleton (desktop/tablet only) */}
                    <div
                      className="hidden md:flex flex-col justify-between mr-3 w-8"
                      style={{ height: `${itemHeight}px` }}
                    >
                      <div className="flex-1 flex justify-center pt-4">
                        <div className="w-4 h-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                      </div>
                      <div className="h-[50px] bg-gray-400 dark:bg-gray-600 rounded flex items-center justify-center animate-pulse">
                        <div className="w-6 h-6 bg-gray-300 dark:bg-gray-500 rounded" />
                      </div>
                    </div>

                    {/* Poster skeleton */}
                    <div
                      className="relative rounded-lg overflow-hidden shadow-xl bg-gray-300 dark:bg-gray-700 animate-pulse"
                      style={{ width: `${ITEM_WIDTH_TABLET}px`, height: `${itemHeight}px` }}
                    >
                      {/* Mobile badge skeleton */}
                      <div className="absolute top-3 left-3 z-10 md:hidden w-8 h-8 bg-gray-400 dark:bg-gray-600 rounded-sm flex items-center justify-center">
                        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-500 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation buttons skeleton (tablet/desktop only) */}
        <div className="hidden md:flex flex-col gap-4 ml-2 shrink-0">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="w-14 bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse"
              style={{ height: `${(ITEM_WIDTH_TABLET * 1.5 - 16) / 2}px` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}


function CarouselItem({
  item,
  position,
  isPriority,
  itemWidth,
  showSidebar,
}: {
  item: MediaItem;
  position: number;
  isPriority: boolean;
  itemWidth: number;
  showSidebar: boolean;
}) {
  const mediaType = item.title ? "movie" : "tv";
  const mediaTitle = (item.title || item.name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const href = `/${mediaType}/${mediaTitle}/${item.id}`;

  const itemHeight = (itemWidth * 3) / 2;

  return (
    <div
      className="flex flex-col flex-shrink-0 transition-transform duration-300 ease-out"
      style={{ width: `${itemWidth}px` }}
      tabIndex={0}
      aria-label={`${item.title || item.name}, position ${position}`}
    >
      <div className="flex">
        {showSidebar && (
          <div
            className="hidden md:flex flex-col justify-between mr-3 w-8"
            style={{ height: `${itemHeight}px` }}
          >
            <div className="flex-1 flex justify-center pt-4">
              <p
                className="cursor-default text-sm font-semibold rotate-180 [writing-mode:vertical-lr] whitespace-nowrap text-light-accent dark:text-dark-accent line-clamp-3"
                title={item.title || item.name}
              >
                {item.title || item.name}
              </p>
            </div>
            <p className="cursor-default text-black dark:text-white text-xl font-bold text-center h-[50px] flex items-center justify-center shrink-0">
              {String(position).padStart(2, "0")}
            </p>
          </div>
        )}

        <Link
          href={href}
          passHref
          className="relative lg:md:rounded-lg overflow-hidden shadow-xl block hover:scale-105 transition-transform duration-300 ease-out"
          style={{ width: `${itemWidth}px`, height: `${itemHeight}px` }}
          prefetch={isPriority}
        >
          <div className="absolute top-3 left-3 z-10 md:hidden w-8 h-8 bg-gray-400 dark:bg-gray-400/60 rounded-sm flex items-center justify-center shadow">
            <span className="text-light-accent dark:text-dark-accent font-bold text-sm">
              {position}
            </span>
          </div>

          {item.poster_path ? (
            <Image
              draggable={false}
              src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
              alt={item.title || item.name || "Media poster"}
              fill
              className="object-cover"
              sizes={`(max-width: 768px) ${itemWidth}px, 33vw`}
              priority={isPriority}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaUMk6MeobdUwVpVjyYfW8K086Slj//2Q=="
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                No image
              </span>
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}

function NavigationButtons({
  onLeft,
  onRight,
  canGoLeft,
  canGoRight,
  itemHeight,
}: {
  onLeft: () => void;
  onRight: () => void;
  canGoLeft: boolean;
  canGoRight: boolean;
  itemHeight: number;
}) {
  const buttonHeight = (itemHeight - 16) / 2;
  const baseBtnClasses =
    "w-14 rounded-md shadow-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent";

  return (
    <div
      className="hidden md:flex flex-col gap-4 ml-2 shrink-0"
      style={{ height: `${itemHeight}px` }}
    >
      <button
        onClick={onLeft}
        disabled={!canGoLeft}
        className={`${baseBtnClasses} ${
          !canGoLeft
            ? "bg-gray-400 dark:bg-gray-600 opacity-40 cursor-not-allowed"
            : "bg-gray-500 dark:bg-gray-800 hover:bg-light-accent dark:hover:bg-dark-accent hover:scale-105 active:scale-95"
        }`}
        style={{ height: `${buttonHeight}px` }}
        aria-label="Scroll left"
      >
        <ChevronLeft size={28} />
      </button>
      <button
        onClick={onRight}
        disabled={!canGoRight}
        className={`${baseBtnClasses} ${
          !canGoRight
            ? "bg-gray-400 dark:bg-gray-600 opacity-40 cursor-not-allowed"
            : "bg-gray-500 dark:bg-gray-800 hover:bg-light-accent dark:hover:bg-dark-accent hover:scale-105 active:scale-95"
        }`}
        style={{ height: `${buttonHeight}px` }}
        aria-label="Scroll right"
      >
        <ChevronRight size={28} />
      </button>
    </div>
  );
}

export default function TrendingCarouselClient() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const { isMobile, isTablet, isDesktop, isClient } = useResponsiveConfig();
  const { visibleCount, itemWidth } = useCarouselDimensions(containerRef);
  const { index, scrollLeft, scrollRight, canGoLeft, canGoRight, isReady } =
    useCarousel(media.length, visibleCount);

  // Fetch trending media
  useEffect(() => {
    const fetchTrendingMedia = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/trending");

        if (!response.ok) {
          throw new Error(`Failed to fetch trending media: ${response.status}`);
        }

        const data = await response.json();
        setMedia(data.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching trending media:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingMedia();
  }, []);

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
    return (
      <section className="relative px-4 w-full">
        <h2 className="text-3xl font-bold mb-6">Trending</h2>
        <div className="text-center py-8 text-red-500">
          <p>Failed to load trending content: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-light-accent text-white rounded hover:bg-opacity-90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  if (!media.length) {
    return (
      <section className="relative px-4 w-full">
        <h2 className="text-3xl font-bold mb-6">Trending</h2>
        <div className="text-center py-8 text-gray-500">
          <p>No trending content available at the moment.</p>
        </div>
      </section>
    );
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

        {/* Updated to show on tablet and desktop */}
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
