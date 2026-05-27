"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faFilm,
} from "@fortawesome/free-solid-svg-icons";
import MediaCard from "@/app/components/mediaCard/mediaCard";

interface SimilarItem {
  id: number;
  title?: string;
  name?: string;
  type: "movie" | "tv";
  year: string;
  poster: string | null;
  backdrop: string | null;
  vote: number;
  overview: string;
  genre_ids: number[];
}

export default function SimilarMediaShelf({ items }: { items: SimilarItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  const [mounted, setMounted] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;

    if (!el) return;

    setAtStart(el.scrollLeft <= 8);

    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 8);
  }, []);

  const onScroll = useCallback(() => {
    if (frame.current) return;

    frame.current = requestAnimationFrame(() => {
      updateScrollState();
      frame.current = null;
    });
  }, [updateScrollState]);

  const scroll = useCallback((dir: 1 | -1) => {
    scrollRef.current?.scrollBy({
      left: dir * 320,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    updateScrollState();

    const el = scrollRef.current;

    if (!el) return;

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });

    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();

      if (frame.current) {
        cancelAnimationFrame(frame.current);
      }
    };
  }, [items, updateScrollState]);

  const showSkeleton = !mounted;

  if (!showSkeleton && !items.length) {
    return null;
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}

      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon
            icon={faFilm}
            size="lg"
            className="
              text-light-accent
              dark:text-dark-accent
            "
          />

          <h2
            className="
              font-bold
              tracking-tight
              text-light-header
              dark:text-dark-header
            "
          >
            More Like This
          </h2>
        </div>

        {!showSkeleton && (
          <div className="flex gap-2">
            <button
              onClick={() => scroll(-1)}
              disabled={atStart}
              aria-label="Scroll left"
              className="
                w-7 h-7
                sm:w-8 sm:h-8

                rounded-full

                border
                border-light-border
                dark:border-dark-border

                bg-light-bg
                dark:bg-dark-card

                flex
                items-center
                justify-center

                text-light-secondary-text
                dark:text-dark-secondary-text

                hover:bg-light-border
                dark:hover:bg-dark-border

                disabled:opacity-30
                disabled:cursor-not-allowed

                transition
              "
            >
              <FontAwesomeIcon
                icon={faChevronLeft}
                className="text-xs sm:text-sm"
              />
            </button>

            <button
              onClick={() => scroll(1)}
              disabled={atEnd}
              aria-label="Scroll right"
              className="
                w-7 h-7
                sm:w-8 sm:h-8

                rounded-full

                border
                border-light-border
                dark:border-dark-border

                bg-light-bg
                dark:bg-dark-card

                flex
                items-center
                justify-center

                text-light-secondary-text
                dark:text-dark-secondary-text

                hover:bg-light-border
                dark:hover:bg-dark-border

                disabled:opacity-30
                disabled:cursor-not-allowed

                transition
              "
            >
              <FontAwesomeIcon
                icon={faChevronRight}
                className="text-xs sm:text-sm"
              />
            </button>
          </div>
        )}
      </div>

      {/* Shelf */}

      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="
            no-scrollbar

            flex
            gap-4

            overflow-x-auto
            overflow-y-hidden

            pb-2

            scroll-smooth

            snap-x
            snap-mandatory

            touch-pan-x
            overscroll-x-contain

            [-webkit-overflow-scrolling:touch]
          "
        >
          {showSkeleton
            ? Array.from({
                length: 6,
              }).map((_, index) => (
                <div
                  key={index}
                  className="
                    shrink-0
                    snap-start

                    w-32
                    sm:w-40
                    md:w-44
                    lg:w-48
                  "
                >
                  <div
                    className="
                      animate-pulse
                    "
                  >
                    <div
                      className="
                        aspect-[2/3]

                        rounded-xl

                        bg-light-border
                        dark:bg-dark-border
                      "
                    />

                    <div className="mt-3 space-y-2">
                      <div
                        className="
                          h-4

                          rounded

                          bg-light-border
                          dark:bg-dark-border
                        "
                      />

                      <div
                        className="
                          h-3
                          w-2/3

                          rounded

                          bg-light-border
                          dark:bg-dark-border
                        "
                      />
                    </div>
                  </div>
                </div>
              ))
            : items.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="
                    shrink-0
                    snap-start

                    w-32
                    sm:w-40
                    md:w-44
                    lg:w-48
                  "
                >
                  <MediaCard
                    index={index}
                    item={{
                      id: item.id,
                      title: item.title,
                      name: item.name,
                      media_type: item.type,
                      poster_path: item.poster ?? undefined,
                      vote_average: item.vote,
                      overview: item.overview,
                      genre_ids: item.genre_ids,
                      release_date:
                        item.type === "movie" ? item.year : undefined,
                      first_air_date:
                        item.type === "tv" ? item.year : undefined,
                    }}
                  />
                </div>
              ))}
        </div>

        {!showSkeleton && !atStart && (
          <div
            className="
              pointer-events-none

              absolute
              left-0
              top-0
              bottom-2

              w-10

              bg-linear-to-r

              from-light-bg
              dark:from-dark-bg

              to-transparent
            "
          />
        )}

        {!showSkeleton && !atEnd && (
          <div
            className="
              pointer-events-none

              absolute
              right-0
              top-0
              bottom-2

              w-10

              bg-linear-to-l

              from-light-bg
              dark:from-dark-bg

              to-transparent
            "
          />
        )}
      </div>
    </section>
  );
}
