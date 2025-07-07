"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faClock,
  faCirclePlay,
  faPlay,
  faAngleRight,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  media_type: string;
  backdrop_path: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
}

interface PopularSpotlightSliderProps {
  apiEndpoint?: string;
  slideDuration?: number;
  maxItems?: number;
  className?: string;
  height?: number | string;
  showNavigation?: boolean;
  showSpotlightNumber?: boolean;
  autoPlay?: boolean;
  showOnMobile?: boolean;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function PopularSpotlightSlider({
  apiEndpoint = "/api/spotLight",
  slideDuration = 5000,
  maxItems = 10,
  className = "",
  height = "420px",
  showNavigation = true,
  showSpotlightNumber = true,
  autoPlay = true,
  showOnMobile = true,
}: PopularSpotlightSliderProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [displayItems, setDisplayItems] = useState<MediaItem[]>([]);
  const [index, setIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const limitedResults = data.results.slice(0, maxItems);
          const clonedItems = [
            limitedResults[limitedResults.length - 1],
            ...limitedResults,
            limitedResults[0],
          ];
          setItems(limitedResults);
          setDisplayItems(clonedItems);
        }
      } catch (error) {
        console.error("Error fetching spotlight data:", error);
      }
    };
    fetchData();
  }, [apiEndpoint, maxItems]);

  const current = items[index - 1] || items[0];

  const next = () => {
    if (isTransitioning || displayItems.length <= 1) return;
    setIsTransitioning(true);
    setIndex((prev) => prev + 1);
    if (index === displayItems.length - 2) {
      setTimeout(() => {
        setIsTransitioning(false);
        setIndex(1);
      }, 500);
    }
  };

  const prev = () => {
    if (isTransitioning || displayItems.length <= 1) return;
    setIsTransitioning(true);
    setIndex((prev) => prev - 1);
    if (index === 1) {
      setTimeout(() => {
        setIsTransitioning(false);
        setIndex(displayItems.length - 2);
      }, 500);
    }
  };

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => next(), slideDuration);
    return () => clearInterval(timer);
  }, [displayItems, isTransitioning, autoPlay, slideDuration]);

  const formatDuration = (minutes: number): string => {
    if (minutes >= 60) {
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }
    return `${minutes}m`;
  };

  if (!current || items.length === 0 || (isMobile && !showOnMobile)) return null;

  return (
    <div
      className={`relative w-full max-w-screen-2xl mx-auto overflow-hidden shadow-xl text-white bg-light-bg dark:bg-dark-bg ${className}`}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
      }}
    >
      <div className="relative w-full h-full overflow-hidden">
        <div
          ref={sliderRef}
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{
            transform: `translateX(-${index * (100 / displayItems.length)}%)`,
            width: `${displayItems.length * 100}%`,
          }}
          onTransitionEnd={() => setIsTransitioning(false)}
        >
          {displayItems.map((item, i) => {
            const itemTitle = item.title || item.name || "Untitled";
            const itemDate = item.release_date || item.first_air_date || "Unknown";
            const itemMediaType = item.media_type.toLowerCase();
            const itemSlug = slugify(itemTitle);
            const itemLinkHref = `/random/${itemMediaType}/${itemSlug}/${item.id}`;

            let itemDuration: string | null = null;
            if (typeof item.runtime === "number" && item.runtime > 0) {
              itemDuration = formatDuration(item.runtime);
            } else if (
              item.media_type === "tv" &&
              Array.isArray(item.episode_run_time) &&
              item.episode_run_time.length > 0
            ) {
              itemDuration = formatDuration(item.episode_run_time[0]);
            }

            return (
              <div
                key={`${item.id}-${i}`}
                className="relative flex-shrink-0 w-full h-full"
                style={{ width: `${100 / displayItems.length}%` }}
              >
                {isMobile ? (
                  <div className="relative w-full h-full">
                    {item.backdrop_path && (
                      <>
                        <Image
                          src={`https://image.tmdb.org/t/p/w1280${item.backdrop_path}`}
                          alt={itemTitle}
                          fill
                          className={`object-cover transition-opacity duration-700 ${
                            current.id === item.id ? "opacity-100" : "opacity-0"
                          }`}
                          sizes="100vw"
                          priority={item.id === current.id}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                          <div className="space-y-3">
                            {showSpotlightNumber && (
                              <div className="text-sm font-medium text-light-accent">
                                #
                                {i === 0
                                  ? items.length
                                  : i > items.length
                                  ? 1
                                  : i}{" "}
                                Spotlight
                              </div>
                            )}
                            <h2 className="text-2xl font-bold text-white">{itemTitle}</h2>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-white/80">
                              <div className="inline-flex items-center gap-1">
                                <FontAwesomeIcon icon={faCirclePlay} className="w-3 h-3" />
                                <span>{itemMediaType.toUpperCase()}</span>
                              </div>
                              {itemDuration && (
                                <div className="inline-flex items-center gap-1">
                                  <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
                                  <span>{itemDuration}</span>
                                </div>
                              )}
                              <div className="inline-flex items-center gap-1">
                                <FontAwesomeIcon icon={faCalendar} className="w-3 h-3" />
                                <span>
                                  {new Date(itemDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm line-clamp-2 text-white/90">{item.overview}</p>
                            <div className="flex gap-2 pt-2">
                              <Link
                                href={itemLinkHref}
                                className="px-3 py-1.5 text-sm rounded-full font-medium flex items-center gap-1 bg-light-btn-bg hover:bg-light-btn-bg-hover text-light-btn-text dark:bg-dark-btn-bg dark:hover:bg-dark-btn-bg-hover dark:text-dark-btn-text"
                              >
                                <FontAwesomeIcon icon={faPlay} className="w-4 h-4" />
                                Watch
                              </Link>
                              <Link
                                href={itemLinkHref}
                                className="px-3 py-1.5 text-sm rounded-full font-medium flex items-center gap-1 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-white"
                              >
                                Details
                                <FontAwesomeIcon icon={faAngleRight} className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex w-full h-full">
                    <div className="flex items-center px-8 lg:px-16 w-full md:w-1/2 z-20 relative">
                      <div className="space-y-4 lg:space-y-5 max-w-xl">
                        {showSpotlightNumber && (
                          <div className="text-sm font-medium text-light-accent">
                            #{i === 0 ? items.length : i > items.length ? 1 : i} Spotlight
                          </div>
                        )}
                        <h2 className="text-3xl lg:text-4xl font-bold text-light-header dark:text-dark-header p-1">
                          {itemTitle}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 lg:gap-6 text-sm text-light-secondary-text dark:text-dark-secondary-text">
                          <div className="inline-flex items-center gap-2">
                            <FontAwesomeIcon icon={faCirclePlay} className="w-4 h-4" />
                            <span>{itemMediaType.toUpperCase()}</span>
                          </div>
                          {itemDuration && (
                            <div className="inline-flex items-center gap-2">
                              <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
                              <span>{itemDuration}</span>
                            </div>
                          )}
                          <div className="inline-flex items-center gap-2">
                            <FontAwesomeIcon icon={faCalendar} className="w-4 h-4" />
                            <span>
                              {new Date(itemDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm lg:text-base line-clamp-2 lg:line-clamp-3 opacity-90 text-light-body-text dark:text-dark-body-text">
                          {item.overview}
                        </p>
                        <div className="flex flex-wrap gap-3 pt-2">
                          <Link
                            href={itemLinkHref}
                            className="px-4 py-2 text-sm lg:text-base rounded-full font-medium flex items-center gap-2 transition bg-light-btn-bg hover:bg-light-btn-bg-hover text-light-btn-text dark:bg-dark-btn-bg dark:hover:bg-dark-btn-bg-hover dark:text-dark-btn-text"
                          >
                            <FontAwesomeIcon icon={faPlay} className="w-4 lg:w-5 h-4 lg:h-5" />
                            Watch Now
                          </Link>
                          <Link
                            href={itemLinkHref}
                            className="px-4 py-2 text-sm lg:text-base rounded-full font-medium transition bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-light-body-text dark:text-dark-body-text flex items-center gap-2"
                          >
                            Details
                            <FontAwesomeIcon icon={faAngleRight} className="w-3 lg:w-4 h-3 lg:h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:block relative w-1/2 h-full">
                      {item.backdrop_path && (
                        <>
                          <Image
                            src={`https://image.tmdb.org/t/p/original${item.backdrop_path}`}
                            alt={itemTitle}
                            fill
                            className={`object-cover object-right transition-opacity duration-700 ${
                              current.id === item.id ? "opacity-100" : "opacity-0"
                            }`}
                            sizes="50vw"
                            priority={item.id === current.id}
                          />
                          <div className="absolute inset-0 z-10 bg-gradient-to-l from-[--color-dark-bg] to-transparent dark:from-[--color-dark-bg]" />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showNavigation && (
        <div
          className={`absolute ${
            isMobile ? "bottom-3 right-3" : "bottom-4 right-4"
          } flex ${isMobile ? "flex-row gap-2" : "flex-col gap-3"} z-30`}
        >
          <button
            onClick={prev}
            className="bg-white/20 hover:bg-white/30 p-1.5 lg:p-2 rounded-full transition"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 lg:w-5 h-4 lg:h-5 text-white" />
          </button>
          <button
            onClick={next}
            className="bg-white/20 hover:bg-white/30 p-1.5 lg:p-2 rounded-full transition"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 lg:w-5 h-4 lg:h-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
