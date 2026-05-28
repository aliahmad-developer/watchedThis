"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import CastCard from "@/app/components/mediaCard/castCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCriticalRole } from "@fortawesome/free-brands-svg-icons";

const CHUNK_SIZE = 10;

export default function CastScroll({
  cast,
  mediaType,
}: {
  cast: any[];
  mediaType: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const [showRightGradient, setShowRightGradient] = useState(false);
  const [showLeftGradient, setShowLeftGradient] = useState(false);

  // Reset when cast changes (e.g. navigating between titles)
  useEffect(() => {
    setVisibleCount(CHUNK_SIZE);
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [cast]);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    setShowLeftGradient(scrollLeft > 10);
    setShowRightGradient(scrollLeft + clientWidth < scrollWidth - 10);

    if (scrollLeft + clientWidth >= scrollWidth - 100) {
      setVisibleCount((prev) =>
        prev >= cast.length ? prev : Math.min(prev + CHUNK_SIZE, cast.length),
      );
    }
  }, [cast.length]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Run once to set initial gradient state
    handleScroll();

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <section className="mt-10 max-w-6xl mx-auto relative">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className="flex items-center justify-center shrink-0 w-5 h-5 mb-1">
          <FontAwesomeIcon
            icon={faCriticalRole}
            className="w-full h-full text-light-accent dark:text-dark-accent"
          />
        </span>

        <h2
          className="
      text-xl
      sm:text-2xl
      font-bold
      leading-none
      text-light-header
      dark:text-dark-header
    "
        >
          Cast
        </h2>
      </div>

      {/* Scroll */}
      <div className="relative">
        <div
          ref={scrollRef}
          style={{ touchAction: "pan-x pan-y" }}
          className="
    no-scrollbar
    flex
    gap-4
    overflow-x-auto
    overflow-y-hidden
    pb-2
    scroll-smooth
    overscroll-x-contain
    [-webkit-overflow-scrolling:touch]
  "
        >
          <div className="flex gap-4 min-w-max pb-2">
            {cast.slice(0, visibleCount).map((actor) => (
              <div
                key={actor.id}
                className="w-28 sm:w-32 shrink-0 transition-transform hover:scale-105"
              >
                <CastCard actor={actor} mediaType={mediaType} />
              </div>
            ))}
          </div>
        </div>

        {/* Left gradient */}
        {showLeftGradient && (
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 h-full w-20 pointer-events-none
              bg-linear-to-r from-light-bg/95 dark:from-dark-bg/95
              via-light-bg/80 dark:via-dark-bg/80 to-transparent"
          />
        )}

        {/* Right gradient */}
        {showRightGradient && (
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 h-full w-20 pointer-events-none
              bg-linear-to-l from-light-bg/95 dark:from-dark-bg/95
              via-light-bg/80 dark:via-dark-bg/80 to-transparent"
          />
        )}
      </div>
    </section>
  );
}
