import { useState, useEffect, useCallback, useRef } from "react";
import { MediaItem, GAP, MOBILE_GAP, ITEM_WIDTH_DESKTOP, ITEM_WIDTH_TABLET } from "./types";

// Window dimensions and responsive calculations
export function useResponsiveConfig() {
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

// Carousel logic
export function useCarousel(mediaLength: number, visibleCount: number) {
  const [index, setIndex] = useState(0);
  const maxIndexRef = useRef(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (mediaLength > 0 && visibleCount > 0) {
      const newMaxIndex = Math.max(0, mediaLength - visibleCount);
      maxIndexRef.current = newMaxIndex;
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
    isReady,
  };
}

// Carousel dimensions
export function useCarouselDimensions(containerRef: React.RefObject<HTMLDivElement | null>) {
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
      newCount = 3;
      calculatedItemWidth = (containerWidth - MOBILE_GAP * 2) / 3;
    } else if (containerWidth >= 768 && containerWidth < 1024) {
      calculatedItemWidth = Math.min(ITEM_WIDTH_TABLET, containerWidth * 0.33);
      newCount = Math.max(
        1,
        Math.floor((containerWidth + GAP) / (calculatedItemWidth + GAP))
      );
    } else {
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

// Fetch trending media
export function useTrendingMedia() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return { media, loading, error };
}