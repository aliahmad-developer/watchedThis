"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSwipeable } from "react-swipeable";
import SliderContainer from "./clientSubCom/SliderContainer";
import NavigationControls from "./clientSubCom/NavigationControls";
import IndicatorDots from "./clientSubCom/IndicatorDots";
import TrailerModal from "../playTrailerModal/trailerModal";
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
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const formatDuration = useCallback((minutes: number): string => {
    if (!minutes) return "";
    if (minutes >= 60) {
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }
    return `${minutes}m`;
  }, []);

  const formatDate = useCallback((dateString: string | undefined): string => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const handleWatchTrailer = useCallback((media: MediaItem) => {
    setCurrentMedia(media);
    setShowTrailer(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (items.length <= 1) return;
    intervalRef.current = setInterval(() => {
      goToNext();
    }, slideDuration);
  }, [slideDuration, items.length]);

  const resetAutoPlayTimer = useCallback(() => {
    if (autoPlay) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      startAutoPlay();
    }
  }, [autoPlay, startAutoPlay]);

  const goToNext = useCallback(() => {
    if (isTransitioning || items.length <= 1) return;

    setIsTransitioning(true);
    resetAutoPlayTimer();

    setCurrentIndex((prev) => {
      const next = prev + 1;
      // If we've reached the clone (index === items.length), animate to it,
      // then after the transition snap silently back to index 0
      if (next === items.length) {
        // Schedule the silent snap after the 500ms animation completes
        transitionTimeoutRef.current = setTimeout(() => {
          setIsTransitioning(false); // disable transition first
          setCurrentIndex(0);        // instant jump to real first slide
        }, 500);
        return next; // go to clone position WITH animation
      }

      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
      return next;
    });
  }, [isTransitioning, items.length, resetAutoPlayTimer]);

  const goToPrev = useCallback(() => {
    if (isTransitioning || items.length <= 1) return;

    setIsTransitioning(true);
    resetAutoPlayTimer();

    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  }, [isTransitioning, items.length, resetAutoPlayTimer]);

  const goToIndex = useCallback(
    (index: number) => {
      if (isTransitioning || index === currentIndex % items.length) return;

      setIsTransitioning(true);
      resetAutoPlayTimer();
      setCurrentIndex(index);

      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    },
    [isTransitioning, currentIndex, items.length, resetAutoPlayTimer]
  );

  const handleCloseTrailer = useCallback(() => {
    setShowTrailer(false);
    if (autoPlay) startAutoPlay();
  }, [autoPlay, startAutoPlay]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrev,
    delta: 10,
    trackTouch: true,
    preventScrollOnSwipe: true,
  });

  useEffect(() => {
    if (autoPlay && !showTrailer) startAutoPlay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, [autoPlay, showTrailer, startAutoPlay]);

  const containerHeight = useMemo(() => {
    return isMobile
      ? typeof mobileHeight === "number" ? `${mobileHeight}px` : mobileHeight
      : typeof height === "number" ? `${height}px` : height;
  }, [isMobile, mobileHeight, height]);

  if (!items || items.length === 0) return null;

  // Dot indicator should show real index (clamp clone back to 0)
  const realIndex = currentIndex % items.length;

  return (
    <>
      <div
        className={`mt-14 sm:mt-12 relative w-full max-w-screen-2xl mx-auto overflow-hidden border-none text-white bg-light-bg dark:bg-dark-bg ${className}`}
        {...swipeHandlers}
        style={{ touchAction: "pan-y", height: containerHeight }}
      >
        <SliderContainer
          items={items}
          currentIndex={currentIndex}
          sliderRef={sliderRef}
          isMobile={isMobile}
          showSpotlightNumber={showSpotlightNumber}
          formatDuration={formatDuration}
          formatDate={formatDate}
          handleWatchTrailer={handleWatchTrailer}
          isTransitioning={isTransitioning}
        />

        {showNavigation && items.length > 1 && (
          <NavigationControls
            isMobile={isMobile}
            isTransitioning={isTransitioning}
            goToPrev={goToPrev}
            goToNext={goToNext}
          />
        )}

        {items.length > 1 && (
          <IndicatorDots
            items={items}
            currentIndex={realIndex}
            goToIndex={goToIndex}
          />
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