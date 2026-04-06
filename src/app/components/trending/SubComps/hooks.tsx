import { useState, useEffect, useCallback, useRef } from "react";
import { GAP, MOBILE_GAP, ITEM_WIDTH_DESKTOP, ITEM_WIDTH_TABLET } from "./types";

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
    if (isReady) setIndex((prev) => Math.max(0, prev - 1));
  }, [isReady]);

  const scrollRight = useCallback(() => {
    if (isReady) setIndex((prev) => Math.min(maxIndexRef.current, prev + 1));
  }, [isReady]);

  return {
    index,
    setIndex,
    scrollLeft,
    scrollRight,
    canGoLeft: isReady && index > 0,
    canGoRight: isReady && index < maxIndexRef.current,
    maxIndex: maxIndexRef.current,
    isReady,
  };
}

export function useCarouselDimensions(containerRef: React.RefObject<HTMLDivElement | null>) {
  // Start at 0 so the parent can gate rendering until we have a real measurement
  const [dimensions, setDimensions] = useState({ visibleCount: 0, itemWidth: 0 });
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    if (containerWidth === 0) return;

    let calculatedItemWidth: number;
    let newCount: number;

    if (containerWidth < 768) {
      newCount = 3;
      calculatedItemWidth = (containerWidth - MOBILE_GAP * 2) / 3;
    } else if (containerWidth < 1024) {
      calculatedItemWidth = Math.min(ITEM_WIDTH_TABLET, containerWidth * 0.33);
      newCount = Math.max(1, Math.floor((containerWidth + GAP) / (calculatedItemWidth + GAP)));
    } else {
      calculatedItemWidth = Math.min(ITEM_WIDTH_DESKTOP, containerWidth * 0.4);
      newCount = Math.max(1, Math.floor((containerWidth + GAP) / (calculatedItemWidth + GAP)));
    }

    setDimensions({ visibleCount: newCount, itemWidth: calculatedItemWidth });
  }, [containerRef]);

  useEffect(() => {
    // Call immediately on mount — this is the key fix
    updateDimensions();

    const handleResize = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(updateDimensions, 150);
    };

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) updateDimensions();
      }
    });

    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, [updateDimensions, containerRef]);

  return dimensions;
}
