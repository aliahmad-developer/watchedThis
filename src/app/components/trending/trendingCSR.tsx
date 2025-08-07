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

const ITEM_WIDTH = 260; // Card width only
const GAP = 24; // Gap between items

export default function TrendingCarouselClient({
  media,
}: {
  media: MediaItem[];
}) {
  const [visibleCount, setVisibleCount] = useState(4);
  const [maxIndex, setMaxIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxIndexRef = useRef(0);

  // Debugging logs
  useEffect(() => {
    console.log("Current state:", {
      index,
      visibleCount,
      mediaLength: media.length,
      maxIndex: maxIndexRef.current,
      canGoLeft: index > 0,
      canGoRight: index < maxIndexRef.current,
    });
  }, [index, visibleCount, media.length]);

  // Responsive item count calculation
  const updateVisibleCount = useCallback(() => {
    const width = window.innerWidth;
    let newVisibleCount = 4;
    if (width >= 1280) newVisibleCount = 4;
    else if (width >= 1024) newVisibleCount = 3;
    else if (width >= 640) newVisibleCount = 2;
    else newVisibleCount = 1;

    console.log("Updating visible count:", newVisibleCount);
    setVisibleCount(newVisibleCount);
  }, []);

  // Debounced resize handler
  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(updateVisibleCount, 100);
    };

    updateVisibleCount();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [updateVisibleCount]);

  // Calculate max index and clamp current index
  useEffect(() => {
    const newMaxIndex = Math.max(0, media.length - visibleCount);
    setMaxIndex(newMaxIndex);
    maxIndexRef.current = newMaxIndex;

    if (index > newMaxIndex) {
      setIndex(newMaxIndex);
    }
  }, [media.length, visibleCount, index]);

  const scrollLeft = () => {
    console.log("Scrolling left from", index);
    setIndex((prev) => {
      const newIndex = Math.max(0, prev - 1);
      console.log("New left index:", newIndex);
      return newIndex;
    });
  };

  const scrollRight = () => {
    console.log("Scrolling right from", index);
    setIndex((prev) => {
      const newIndex = Math.min(maxIndexRef.current, prev + 1);
      console.log("New right index:", newIndex);
      return newIndex;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!carouselRef.current?.contains(document.activeElement)) return;

      if (e.key === "ArrowLeft") scrollLeft();
      else if (e.key === "ArrowRight") scrollRight();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Edge case: No media
  if (!media.length) return null;

  const canGoLeft = index > 0;
  const canGoRight = index < maxIndex;

  console.log("Rendering with:", {
    canGoLeft,
    canGoRight,
    currentIndex: index,
    maxIndex: maxIndexRef.current,
  });

  return (
    <section className="relative px-4 py-6 w-full" ref={carouselRef}>
      <h2 className="text-2xl font-bold mb-6">Trending</h2>

      <div className="flex w-full items-start">
        {/* Carousel area */}
        <div className="relative overflow-hidden flex-1">
          <div
            className="flex gap-6 transition-transform duration-500 ease-in-out pb-6 pr-4"
            style={{
              transform: `translateX(calc(-${index} * (${ITEM_WIDTH}px + ${GAP}px)))`,
              width: `calc(${media.length} * (${ITEM_WIDTH}px + ${GAP}px) - ${GAP}px)`,
            }}
          >
            {media.map((item, idx) => (
              <CarouselItem
                key={item.id}
                item={item}
                position={idx + 1}
                isPriority={idx < visibleCount}
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

// Extracted Carousel Item Component
function CarouselItem({
  item,
  position,
  isPriority,
}: {
  item: MediaItem;
  position: number;
  isPriority: boolean;
}) {
  // Determine media type based on available properties
  const mediaType = item.title ? "movie" : "tv";
  const mediaTitle = (item.title || item.name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const href = `/${mediaType}/${mediaTitle}/${item.id}`;

  return (
    <div
      className="flex flex-col flex-shrink-0"
      style={{ width: `${ITEM_WIDTH}px`, scrollSnapAlign: "start" }}
      tabIndex={0}
      aria-label={`${item.title || item.name}, position ${position}`}
    >
      <div className="flex h-[380px]">
        {/* Title area */}
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

        {/* Poster with link */}
        <Link
          href={href}
          passHref
          className="relative w-[242px] h-full rounded-lg overflow-hidden shadow-xl block"
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
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">No image</span>
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}

// Extracted Navigation Buttons Component
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
  return (
    <div className="flex flex-col gap-4 ml-2 shrink-0">
      <button
        onClick={onLeft}
        disabled={!canGoLeft}
        className={`w-12 h-[180px] rounded-md shadow-lg flex items-center justify-center
          transition-all duration-200
          ${
            !canGoLeft
              ? "bg-gray-400 dark:bg-gray-600 opacity-40 cursor-not-allowed"
              : "bg-gray-500 dark:bg-gray-800 hover:bg-light-accent dark:hover:bg-dark-accent"
          }
        `}
        aria-label="Scroll left"
      >
        <ChevronLeft size={28} className={!canGoLeft ? "text-gray-500" : ""} />
      </button>
      <button
        onClick={onRight}
        disabled={!canGoRight}
        className={`w-12 h-[180px] rounded-md shadow-lg flex items-center justify-center
          transition-all duration-200
          ${
            !canGoRight
              ? "bg-gray-400 dark:bg-gray-600 opacity-40 cursor-not-allowed"
              : "bg-gray-500 dark:bg-gray-800 hover:bg-light-accent dark:hover:bg-dark-accent"
          }
        `}
        aria-label="Scroll right"
      >
        <ChevronRight
          size={28}
          className={!canGoRight ? "text-gray-500" : ""}
        />
      </button>
    </div>
  );
}
