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

// Skeleton component for loading state
function TrendingCarouselSkeleton() {
  const [visibleCount, setVisibleCount] = useState(4);
  
  const updateVisibleCount = useCallback(() => {
    const containerWidth = window.innerWidth - 32; // Subtract padding
    const itemWidth = Math.min(260, containerWidth * 0.4); // Dynamic item width
    const newCount = Math.max(1, Math.floor((containerWidth + GAP) / (itemWidth + GAP)));
    setVisibleCount(newCount);
  }, []);

  useEffect(() => {
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, [updateVisibleCount]);

  return (
    <section className="relative px-4 w-full">
      <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-6 animate-pulse"></div>

      <div className="flex w-full items-start">
        <div className="relative overflow-hidden flex-1">
          <div className="flex gap-6 pb-6 pr-5">
            {Array.from({ length: visibleCount }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col flex-shrink-0 animate-pulse"
                style={{ width: `calc((100% - ${(visibleCount - 1) * GAP}px) / ${visibleCount})` }}
              >
                <div className="flex h-[380px]">
                  <div className="flex flex-col justify-between h-full mr-3 w-8">
                    <div className="h-[320px] flex justify-center">
                      <div className="w-4 h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="h-[60px] bg-gray-300 dark:bg-gray-700 rounded flex items-center justify-center">
                      <div className="w-6 h-6 bg-gray-400 dark:bg-gray-600 rounded"></div>
                    </div>
                  </div>

                  <div className="relative flex-1 h-full rounded-lg overflow-hidden shadow-xl bg-gray-300 dark:bg-gray-700">
                    <div className="w-full h-full bg-gray-300 dark:bg-gray-700"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 ml-2 shrink-0">
          <div className="w-14 h-[180px] bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse"></div>
          <div className="w-14 h-[180px] bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}

export default function TrendingCarouselClient() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const [itemWidth, setItemWidth] = useState(260);
  const [maxIndex, setMaxIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxIndexRef = useRef(0);

  // Fetch trending media on client side
  useEffect(() => {
    const fetchTrendingMedia = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/trending');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch trending media: ${response.status}`);
        }
        
        const data = await response.json();
        setMedia(data.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching trending media:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingMedia();
  }, []);

  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    // Calculate item width based on container size
    const calculatedItemWidth = Math.min(260, containerWidth * 0.4);
    setItemWidth(calculatedItemWidth);
    
    // Calculate how many items can fit in the container
    const newCount = Math.max(1, Math.floor((containerWidth + GAP) / (calculatedItemWidth + GAP)));
    setVisibleCount(newCount);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(updateDimensions, 100);
    };

    updateDimensions();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, [updateDimensions]);

  useEffect(() => {
    const newMaxIndex = Math.max(0, media.length - visibleCount);
    setMaxIndex(newMaxIndex);
    maxIndexRef.current = newMaxIndex;
    if (index > newMaxIndex) setIndex(newMaxIndex);
  }, [media.length, visibleCount, index]);

  const scrollLeft = useCallback(() => {
    setIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const scrollRight = useCallback(() => {
    setIndex((prev) => Math.min(maxIndexRef.current, prev + 1));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!carouselRef.current?.contains(document.activeElement)) return;
      if (e.key === "ArrowLeft") scrollLeft();
      else if (e.key === "ArrowRight") scrollRight();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [scrollLeft, scrollRight]);

  // Show skeleton while loading
  if (loading) {
    return <TrendingCarouselSkeleton />;
  }

  // Show error message if fetch failed
  if (error) {
    return (
      <section className="relative px-4 w-full">
        <h2 className="text-3xl font-bold mb-6">Trending</h2>
        <div className="text-center py-8 text-red-500">
          <p>Failed to load trending content: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-light-accent text-white rounded"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  // Show empty state if no media
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

  const canGoLeft = index > 0;
  const canGoRight = index < maxIndex;

  return (
    <section className="relative px-4 w-full" ref={carouselRef}>
      <h2 className="text-3xl font-bold mb-6">Trending</h2>

      <div className="flex w-full items-start" ref={containerRef}>
        <div className="relative overflow-hidden flex-1">
          <div
            className="flex gap-6 transition-transform duration-500 ease-in-out pb-6 pr-5"
            style={{
              transform: `translateX(calc(-${index} * (${itemWidth}px + ${GAP}px)))`,
              width: `calc(${media.length} * (${itemWidth}px + ${GAP}px) - ${GAP}px)`,
            }}
          >
            {media.map((item, idx) => (
              <CarouselItem
                key={item.id}
                item={item}
                position={idx + 1}
                isPriority={idx < visibleCount}
                itemWidth={itemWidth}
              />
            ))}
          </div>
        </div>

        <NavigationButtons
          onLeft={scrollLeft}
          onRight={scrollRight}
          canGoLeft={canGoLeft}
          canGoRight={canGoRight}
        />
      </div>
    </section>
  );
}

function CarouselItem({
  item,
  position,
  isPriority,
  itemWidth,
}: {
  item: MediaItem;
  position: number;
  isPriority: boolean;
  itemWidth: number;
}) {
  const mediaType = item.title ? "movie" : "tv";
  const mediaTitle = (item.title || item.name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const href = `/${mediaType}/${mediaTitle}/${item.id}`;

  return (
    <div
      className="flex flex-col flex-shrink-0"
      style={{ width: `${itemWidth}px` }}
      tabIndex={0}
      aria-label={`${item.title || item.name}, position ${position}`}
    >
      <div className="flex h-[380px]">
        <div className="flex flex-col justify-between h-full mr-3 w-8">
          <div className="h-[320px] flex justify-center">
            <p className="cursor-default text-sm font-semibold rotate-180 [writing-mode:vertical-lr] whitespace-nowrap text-light-accent dark:text-dark-accent">
              {item.title || item.name}
            </p>
          </div>
          <p className="cursor-default text-black dark:text-white text-xl font-bold text-center h-[60px] flex items-center justify-center">
            {String(position).padStart(2, "0")}
          </p>
        </div>

        <Link
          href={href}
          passHref
          className="relative flex-1 h-full rounded-lg overflow-hidden shadow-xl block aspect-[2/3]"
        >
          {item.poster_path ? (
            <Image
              draggable={false}
              src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
              alt={item.title || item.name || "Media poster"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              priority={isPriority}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400">No image</span>
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
}: {
  onLeft: () => void;
  onRight: () => void;
  canGoLeft: boolean;
  canGoRight: boolean;
}) {
  const btnClasses =
    "w-14 h-[180px] rounded-md shadow-lg flex items-center justify-center transition-all duration-200";

  return (
    <div className="flex flex-col gap-4 ml-2 shrink-0">
      <button
        onClick={onLeft}
        disabled={!canGoLeft}
        className={`${btnClasses} ${
          !canGoLeft
            ? "bg-gray-400 dark:bg-gray-600 opacity-40 cursor-not-allowed"
            : "bg-gray-500 dark:bg-gray-800 hover:bg-light-accent dark:hover:bg-dark-accent"
        }`}
        aria-label="Scroll left"
      >
        <ChevronLeft size={28} />
      </button>
      <button
        onClick={onRight}
        disabled={!canGoRight}
        className={`${btnClasses} ${
          !canGoRight
            ? "bg-gray-400 dark:bg-gray-600 opacity-40 cursor-not-allowed"
            : "bg-gray-500 dark:bg-gray-800 hover:bg-light-accent dark:hover:bg-dark-accent"
        }`}
        aria-label="Scroll right"
      >
        <ChevronRight size={28} />
      </button>
    </div>
  );
}