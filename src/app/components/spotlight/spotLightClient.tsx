"use client";

import { useSwipeable } from "react-swipeable";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faClock,
  faCirclePlay,
  faPlay,
  faAngleRight,
} from "@fortawesome/free-solid-svg-icons";
import TrailerModal from "../playTrailerModal/trailerModal";
import { MediaItem } from "./types";

// ----------------------
// Utils
// ----------------------
const TRANSITION_MS = 500;

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function getSpotlightNumber(i: number, total: number) {
  return i === 0 ? total : i > total ? 1 : i;
}

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  return `${minutes}m`;
}

function GradientOverlays() {
  return (
    <>
      <div className="absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-light-bg to-transparent dark:from-dark-bg pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-1/5 bg-gradient-to-l from-light-bg to-transparent dark:from-dark-bg pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-light-bg to-transparent dark:from-dark-bg pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-light-bg to-transparent dark:from-dark-bg pointer-events-none" />
    </>
  );
}

// ----------------------
// Subcomponents
// ----------------------
interface SlideProps {
  item: MediaItem;
  current: MediaItem;
  index: number;
  total: number;
  onWatchTrailer: (media: MediaItem) => void;
  showSpotlightNumber: boolean;
}

function MobileView({
  item,
  current,
  index,
  total,
  onWatchTrailer,
  showSpotlightNumber,
}: SlideProps) {
  const itemTitle = item.title || item.name || "Untitled";
  const itemSlug = slugify(itemTitle);
  const itemMediaType = item.media_type.toLowerCase();
  const itemLinkHref = `/${itemMediaType}/${itemSlug}/${item.id}`;

  return (
    <div className="md:hidden relative w-full h-full">
      {item.backdrop_path && (
        <>
          <Image
            draggable={false}
            src={`https://image.tmdb.org/t/p/w1280${item.backdrop_path}`}
            alt={itemTitle}
            fill
            className={`object-cover transition-opacity duration-700 ${
              current.id === item.id ? "opacity-100" : "opacity-0"
            }`}
            sizes="100vw"
            loading={item.id === current.id ? "eager" : "lazy"}
          />
          <GradientOverlays />

          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <div className="space-y-2">
              {showSpotlightNumber && (
                <div className="text-xs font-medium text-light-header dark:text-dark-disabled">
                  #{getSpotlightNumber(index, total)} Spotlight
                </div>
              )}
              <h2 className="text-xl font-bold text-white line-clamp-1">
                {itemTitle}
              </h2>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onWatchTrailer(item)}
                  className="px-3 py-1 text-xs rounded-full font-medium flex items-center gap-1 bg-light-btn-bg hover:bg-light-btn-bg-hover text-light-btn-text dark:bg-dark-btn-bg dark:hover:bg-dark-btn-bg-hover dark:text-dark-btn-text"
                >
                  <FontAwesomeIcon icon={faPlay} className="w-3 h-3" />
                  Watch Trailer
                </button>
                <Link
                  href={itemLinkHref}
                  className="px-3 py-1 text-xs rounded-full font-medium flex items-center gap-1 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-white"
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
  );
}

function DesktopView({
  item,
  current,
  index,
  total,
  onWatchTrailer,
  showSpotlightNumber,
}: SlideProps) {
  const itemTitle = item.title || item.name || "Untitled";
  const itemDate = item.release_date || item.first_air_date || "Unknown";
  const itemSlug = slugify(itemTitle);
  const itemMediaType = item.media_type.toLowerCase();
  const itemLinkHref = `/${itemMediaType}/${itemSlug}/${item.id}`;
  let itemDuration: string | null = null;

  if (item.media_type === "movie" && item.runtime) {
    itemDuration = formatDuration(item.runtime);
  } else if (item.media_type === "tv" && item.episode_run_time?.[0]) {
    itemDuration = formatDuration(item.episode_run_time[0]);
  }

  return (
    <div className="hidden md:flex w-full h-full">
      {/* Left: text */}
      <div className="flex items-center px-8 lg:px-10 w-full md:w-1/2 z-20 relative">
        <div className="space-y-4 lg:space-y-5 max-w-xl">
          {showSpotlightNumber && (
            <div className="text-sm font-medium text-light-header dark:text-dark-disabled">
              #{getSpotlightNumber(index, total)} Spotlight
            </div>
          )}
          <h2 className="text-3xl lg:text-4xl font-bold text-light-header dark:text-white p-1 line-clamp-2">
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
          <p className="text-sm lg:text-base line-clamp-2 opacity-90 text-light-body-text dark:text-dark-body-text">
            {item.overview}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => onWatchTrailer(item)}
              className="px-4 py-2 text-sm lg:text-base rounded-full font-medium flex items-center gap-2 transition bg-light-btn-bg hover:bg-light-btn-bg-hover text-light-btn-text dark:bg-dark-btn-bg dark:hover:bg-dark-btn-bg-hover dark:text-dark-btn-text"
            >
              <FontAwesomeIcon icon={faPlay} className="w-4 lg:w-5 h-4 lg:h-5" />
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

      {/* Right: image */}
      <div className="hidden md:block relative w-4/5 h-full">
        {item.backdrop_path && (
          <>
            <Image
              draggable={false}
              src={`https://image.tmdb.org/t/p/original${item.backdrop_path}`}
              alt={itemTitle}
              fill
              className={`object-cover object-right transition-opacity duration-700 ${
                current.id === item.id ? "opacity-100" : "opacity-0"
              }`}
              sizes="50vw"
              loading={item.id === current.id ? "eager" : "lazy"}
            />
            <GradientOverlays />
          </>
        )}
      </div>
    </div>
  );
}

// ----------------------
// Main Component
// ----------------------
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const displayItems = [items[items.length - 1], ...items, items[0]];
  const current = items[index - 1] || items[0];

  const startAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => next(), slideDuration);
  };

  const handleWatchTrailer = (media: MediaItem) => {
    setCurrentMedia(media);
    setShowTrailer(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleCloseTrailer = () => {
    setShowTrailer(false);
    if (autoPlay) startAutoPlay();
  };

  const next = () => {
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
      }, TRANSITION_MS);
    } else {
      setTimeout(() => setIsTransitioning(false), TRANSITION_MS);
    }
  };

  const prev = () => {
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
      }, TRANSITION_MS);
    } else {
      setTimeout(() => setIsTransitioning(false), TRANSITION_MS);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => next(),
    onSwipedRight: () => prev(),
    delta: 10,
    trackTouch: true,
    preventScrollOnSwipe: true,
  });

  useEffect(() => {
    if (autoPlay && !showTrailer) startAutoPlay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoPlay, showTrailer, slideDuration]);

  if (!current || items.length === 0) return null;

  return (
    <>
      <div
        className={`relative w-full max-w-screen-2xl mx-auto overflow-hidden border-none text-white bg-light-bg dark:bg-dark-bg ${className}`}
        {...swipeHandlers}
        style={{
          touchAction: "pan-y",
          height: isMobile
            ? typeof mobileHeight === "number"
              ? `${mobileHeight}px`
              : mobileHeight
            : typeof height === "number"
            ? `${height}px`
            : height,
        }}
      >
        <div className="relative w-full h-full overflow-hidden pointer-none">
          <div
            className={`flex h-full ${
              disableTransition
                ? ""
                : "transition-transform duration-500 ease-in-out"
            }`}
            style={{
              transform: `translateX(-${index * (100 / displayItems.length)}%)`,
              width: `${displayItems.length * 100}%`,
            }}
            onTransitionEnd={() => setIsTransitioning(false)}
          >
            {displayItems.map((item, i) => (
              <div
                key={`${item.id}-${i}`}
                className="relative flex-shrink-0 w-full h-full"
                style={{ width: `${100 / displayItems.length}%` }}
                aria-hidden={current.id !== item.id}
              >
                <MobileView
                  item={item}
                  current={current}
                  index={i}
                  total={items.length}
                  onWatchTrailer={handleWatchTrailer}
                  showSpotlightNumber={showSpotlightNumber}
                />
                <DesktopView
                  item={item}
                  current={current}
                  index={i}
                  total={items.length}
                  onWatchTrailer={handleWatchTrailer}
                  showSpotlightNumber={showSpotlightNumber}
                />
              </div>
            ))}
          </div>
        </div>

        {showNavigation && (
          <div className="absolute z-30 flex gap-1 md:gap-3 bottom-2 right-2 md:bottom-4 md:right-4 flex-row md:flex-col">
            {[
              { dir: "prev", Icon: ChevronLeft, label: "Previous slide" },
              { dir: "next", Icon: ChevronRight, label: "Next slide" },
            ].map(({ dir, Icon, label }) => (
              <button
                key={dir}
                onClick={dir === "prev" ? prev : next}
                aria-label={label}
                className="bg-black/20 hover:bg-black/30 
                   dark:bg-white/20 dark:hover:bg-white/30 
                   p-2 rounded-full transition"
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5 text-black dark:text-white" />
              </button>
            ))}
          </div>
        )}
      </div>

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
