"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TrailerModal from "../playTrailerModal/trailerModal";
import { createSlug } from "@/app/components/utilities/createSlug";
import {
  faCalendar,
  faClock,
  faCirclePlay,
  faPlay,
  faAngleRight,
} from "@fortawesome/free-solid-svg-icons";
import { useSwipeable } from "react-swipeable";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MediaItem } from "./types";

interface Props {
  items: MediaItem[];
  slideDuration?: number;
  className?: string;
  height?: number | string;
  mobileHeight?: number | string;
  showNavigation?: boolean;
  showSpotlightNumber?: boolean;
  autoPlay?: boolean;
  isMobile?: boolean;
}



export default function PopularSpotlightSliderClient({
  items,
  slideDuration = 5000,
  className = "",
  height = "420px",
  mobileHeight = "280px",
  showNavigation = true,
  showSpotlightNumber = true,
  autoPlay = true,
  isMobile = false,
}: Props) {
  const [index, setIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [disableTransition, setDisableTransition] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize displayItems to prevent unnecessary recalculations
  const displayItems = useMemo(() => {
    return [items[items.length - 1], ...items, items[0]];
  }, [items]);

  const current = useMemo(() => {
    return items[index - 1] || items[0];
  }, [items, index]);

  // Memoize the formatDuration function
  const formatDuration = useCallback((minutes: number): string => {
    if (minutes >= 60) {
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }
    return `${minutes}m`;
  }, []);

  const handleWatchTrailer = useCallback((media: MediaItem) => {
    setCurrentMedia(media);
    setShowTrailer(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleCloseTrailer = useCallback(() => {
    setShowTrailer(false);
    if (autoPlay) {
      startAutoPlay();
    }
  }, [autoPlay]);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      next();
    }, slideDuration);
  }, [slideDuration]);

  const next = useCallback(() => {
    if (isTransitioning) return;

    const nextIndex = index + 1;
    setIsTransitioning(true);
    setIndex(nextIndex);

    if (nextIndex === displayItems.length - 1) {
      setTimeout(() => {
        setDisableTransition(true);
        setIndex(1);
        requestAnimationFrame(() => {
          setDisableTransition(false);
          setIsTransitioning(false);
        });
      }, 500);
    } else {
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }
  }, [index, isTransitioning, displayItems.length]);

  const prev = useCallback(() => {
    if (isTransitioning) return;

    const prevIndex = index - 1;
    setIsTransitioning(true);
    setIndex(prevIndex);

    if (prevIndex === 0) {
      setTimeout(() => {
        setDisableTransition(true);
        setIndex(displayItems.length - 2);
        requestAnimationFrame(() => {
          setDisableTransition(false);
          setIsTransitioning(false);
        });
      }, 500);
    } else {
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }
  }, [index, isTransitioning, displayItems.length]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: next,
    onSwipedRight: prev,
    delta: 10,
    trackTouch: true,
    preventScrollOnSwipe: true,
  });

  useEffect(() => {
    if (autoPlay && !showTrailer) {
      startAutoPlay();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoPlay, showTrailer, startAutoPlay]);

  // Early return optimization
  if (!current || items.length === 0) return null;

  // Memoize the slider transform style
  const sliderTransform = useMemo(() => {
    return `translateX(-${index * (100 / displayItems.length)}%)`;
  }, [index, displayItems.length]);

  // Memoize the slider width style
  const sliderWidth = useMemo(() => {
    return `${displayItems.length * 100}%`;
  }, [displayItems.length]);

  // Memoize the container height style
  const containerHeight = useMemo(() => {
    return isMobile
      ? typeof mobileHeight === "number"
        ? `${mobileHeight}px`
        : mobileHeight
      : typeof height === "number"
      ? `${height}px`
      : height;
  }, [isMobile, mobileHeight, height]);

  return (
    <>
      <div
        className={`relative w-full max-w-screen-2xl mx-auto overflow-hidden border-none text-white bg-light-bg dark:bg-dark-bg ${className}`}
        {...swipeHandlers}
        style={{
          touchAction: "pan-y",
          height: containerHeight,
        }}
      >
        <div className="relative w-full h-full overflow-hidden pointer-none">
          <div
            ref={sliderRef}
            className={`flex h-full ${
              disableTransition
                ? ""
                : "transition-transform duration-500 ease-in-out"
            }`}
            style={{
              transform: sliderTransform,
              width: sliderWidth,
            }}
            onTransitionEnd={() => setIsTransitioning(false)}
          >
            {displayItems.map((item, i) => {
              const itemTitle = item.title || item.name || "Untitled";
              const itemDate =
                item.release_date || item.first_air_date || "Unknown";
              const itemMediaType = item.media_type.toLowerCase();
              const itemSlug = createSlug(itemTitle);
              const itemLinkHref = `/${itemMediaType}/${itemSlug}/${item.id}`;
              
              let itemDuration: string | null = null;
              if (item.media_type === "movie" && item.runtime) {
                itemDuration = formatDuration(item.runtime);
              } else if (
                item.media_type === "tv" &&
                item.episode_run_time?.[0]
              ) {
                itemDuration = formatDuration(item.episode_run_time[0]);
              }

              const isCurrentItem = current.id === item.id;
              const backdropPath = item.backdrop_path 
                ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
                : null;

              return (
                <div
                  key={`${item.id}-${i}`}
                  className="relative flex-shrink-0 w-full h-full"
                  style={{ width: `${100 / displayItems.length}%` }}
                >
                  {/* Mobile View */}
                  <div className="md:hidden relative w-full h-full">
                    {backdropPath && (
                      <>
                        <Image
                          draggable={false}
                          src={backdropPath.replace('original', 'w1280')}
                          alt={itemTitle}
                          fill
                          className={`object-cover transition-opacity duration-700 ${
                            isCurrentItem ? "opacity-100" : "opacity-0"
                          }`}
                          sizes="(min-width: 768px) 100vw, 100vw"
                          priority={isCurrentItem}
                        />
                        <div className="absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-[#f8f9fa] to-transparent dark:from-[#1a1a1a]" />
                        <div className="absolute inset-y-0 right-0 w-1/5 bg-gradient-to-l from-[#f8f9fa] to-transparent dark:from-[#1a1a1a]" />
                        <div className="absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-[#f8f9fa] to-transparent dark:from-[#1a1a1a]" />
                        <div className="absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-[#f8f9fa] to-transparent dark:from-[#1a1a1a]" />

                        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                          <div className="space-y-2">
                            {showSpotlightNumber && (
                              <div className="text-xs font-medium text-light-header dark:text-dark-disabled">
                                #
                                {i === 0
                                  ? items.length
                                  : i > items.length
                                  ? 1
                                  : i}{" "}
                                Spotlight
                              </div>
                            )}
                            <h2 className="text-xl font-bold text-white line-clamp-1">
                              {itemTitle}
                            </h2>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleWatchTrailer(item)}
                                className="px-3 py-1 text-xs rounded-full font-medium flex items-center gap-1 bg-light-btn-bg hover:bg-light-btn-bg-hover text-light-btn-text dark:bg-dark-btn-bg dark:hover:bg-dark-btn-bg-hover dark:text-dark-btn-text"
                              >
                                <FontAwesomeIcon
                                  icon={faPlay}
                                  className="w-3 h-3"
                                />
                                Watch Trailer
                              </button>
                              <Link
                                href={itemLinkHref}
                                className="px-3 py-1 text-xs rounded-full font-medium flex items-center gap-1 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-white"
                              >
                                Details
                                <FontAwesomeIcon
                                  icon={faAngleRight}
                                  className="w-2 h-2"
                                />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:flex w-full h-full">
                    <div className="flex items-center px-8 lg:px-10 w-full md:w-1/2 z-20 relative">
                      <div className="space-y-4 lg:space-y-5 max-w-xl">
                        {showSpotlightNumber && (
                          <div className="text-sm font-medium text-light-header dark:text-dark-disabled">
                            #{i === 0 ? items.length : i > items.length ? 1 : i}{" "}
                            Spotlight
                          </div>
                        )}
                        <h2 className="text-3xl lg:text-4xl font-bold text-light-header dark:text-white p-1 line-clamp-2">
                          {itemTitle}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 lg:gap-6 text-sm text-light-secondary-text dark:text-dark-secondary-text">
                          <div className="inline-flex items-center gap-2">
                            <FontAwesomeIcon
                              icon={faCirclePlay}
                              className="w-4 h-4"
                            />
                            <span>{itemMediaType.toUpperCase()}</span>
                          </div>
                          {itemDuration && (
                            <div className="inline-flex items-center gap-2">
                              <FontAwesomeIcon
                                icon={faClock}
                                className="w-4 h-4"
                              />
                              <span>{itemDuration}</span>
                            </div>
                          )}
                          <div className="inline-flex items-center gap-2">
                            <FontAwesomeIcon
                              icon={faCalendar}
                              className="w-4 h-4"
                            />
                            <span>
                              {new Date(itemDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm lg:text-base line-clamp-2 lg:line-clamp-2 opacity-90 text-light-body-text dark:text-dark-body-text">
                          {item.overview}
                        </p>
                        <div className="flex flex-wrap gap-3 pt-2">
                          <button
                            onClick={() => handleWatchTrailer(item)}
                            className="px-4 py-2 text-sm lg:text-base rounded-full font-medium flex items-center gap-2 transition bg-light-btn-bg hover:bg-light-btn-bg-hover text-light-btn-text dark:bg-dark-btn-bg dark:hover:bg-dark-btn-bg-hover dark:text-dark-btn-text"
                          >
                            <FontAwesomeIcon
                              icon={faPlay}
                              className="w-4 lg:w-5 h-4 lg:h-5"
                            />
                            Watch Trailer
                          </button>
                          <Link
                            href={itemLinkHref}
                            className="px-4 py-2 text-sm lg:text-base rounded-full font-medium transition bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-light-body-text dark:text-dark-body-text flex items-center gap-2"
                          >
                            Details
                            <FontAwesomeIcon
                              icon={faAngleRight}
                              className="w-3 lg:w-4 h-3 lg:h-4"
                            />
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:block relative w-4/5 h-full">
                      {backdropPath && (
                        <>
                          <Image
                            draggable={false}
                            src={backdropPath}
                            alt={itemTitle}
                            fill
                            className={`object-cover object-right transition-opacity duration-700 ${
                              isCurrentItem ? "opacity-100" : "opacity-0"
                            }`}
                            sizes="50vw"
                            priority={isCurrentItem}
                          />

                          <div className="absolute inset-y-0 left-0 w-1/5 z-10 pointer-events-none bg-gradient-to-r from-[#f8f9fa] to-transparent dark:from-[#1a1a1a]" />
                          <div className="absolute inset-y-0 right-0 w-1/5 z-10 pointer-events-none bg-gradient-to-l from-[#f8f9fa] to-transparent dark:from-[#1a1a1a]" />
                          <div className="absolute inset-x-0 top-0 h-1/5 z-10 pointer-events-none bg-gradient-to-b from-[#f8f9fa] to-transparent dark:from-[#1a1a1a]" />
                          <div className="absolute inset-x-0 bottom-0 h-1/5 z-10 pointer-events-none bg-gradient-to-t from-[#f8f9fa] to-transparent dark:from-[#1a1a1a]" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showNavigation && (
          <>
            {/* Mobile Navigation */}
            <div className="md:hidden absolute bottom-2 right-2 flex flex-row gap-1 z-30">
              <button
                onClick={prev}
                className="bg-black/20 hover:bg-black/30 dark:bg-white/20 dark:hover:bg-white/30 p-2 rounded-full transition"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-3 h-3 text-black dark:text-white" />
              </button>
              <button
                onClick={next}
                className="bg-black/20 hover:bg-black/30 dark:bg-white/20 dark:hover:bg-white/30 p-2 rounded-full transition"
                aria-label="Next slide"
              >
                <ChevronRight className="w-3 h-3 text-black dark:text-white" />
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex absolute bottom-4 right-4 flex-col gap-3 z-30">
              <button
                onClick={prev}
                className="bg-black/20 hover:bg-black/30 dark:bg-white/20 dark:hover:bg-white/30 p-2 rounded-full transition"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5 text-black dark:text-white" />
              </button>
              <button
                onClick={next}
                className="bg-black/20 hover:bg-black/30 dark:bg-white/20 dark:hover:bg-white/30 p-2 rounded-full transition"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5 text-black dark:text-white" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Trailer Modal */}
      {showTrailer && currentMedia && (
        <TrailerModal
          mediaId={currentMedia.id}
          mediaType={currentMedia.media_type as "movie" | "tv"}
          onClose={handleCloseTrailer}
          title={currentMedia.title || currentMedia.name}
        />
      )}
    </>
  );
}