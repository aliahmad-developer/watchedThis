"use client";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import ColorThief from "color-thief-browser";
import MediaPoster from "./mediaPoster";
import MediaInfo from "./MediaInfo";
import MediaInfoSkeleton from "./MediaInfo/Skeleton/MainInfoSkeleton";
import MediaPosterSkeleton from "./MediaInfo/Skeleton/PosterSkeleton";

interface DescProps {
  data: any;
  backdropUrl?: string;
  isLoading?: boolean;
}

// Constants
const COLOR_SCHEME_MEDIA_QUERY = "(prefers-color-scheme: light)";
const GRAY_COLORS = {
  light: "rgb(229,231,235)",
  dark: "rgb(31,41,55)",
} as const;

const BACKDROP_QUALITY = 85;
const TRANSITION_DURATION = 700;
const OVERLAY_BLUR = "blur(3px)";

// Utility functions
const getGrayColor = (isLight: boolean) => 
  isLight ? GRAY_COLORS.light : GRAY_COLORS.dark;

const calculateLuminance = (r: number, g: number, b: number): number => 
  (0.299 * r + 0.587 * g + 0.114 * b) / 255;

const getAdjustedColor = (
  r: number, 
  g: number, 
  b: number, 
  luminance: number, 
  isLightMode: boolean
): string => {
  if (isLightMode) {
    const lightAdjust = luminance > 0.7 ? 0.85 : 0.7;
    return `rgb(
      ${Math.min(Math.floor(r * lightAdjust + 40), 255)}, 
      ${Math.min(Math.floor(g * lightAdjust + 40), 255)}, 
      ${Math.min(Math.floor(b * lightAdjust + 40), 255)}
    )`;
  } else {
    const darkAdjust = luminance < 0.3 ? 0.75 : 0.55;
    return `rgb(
      ${Math.floor(r * darkAdjust)}, 
      ${Math.floor(g * darkAdjust)}, 
      ${Math.floor(b * darkAdjust)}
    )`;
  }
};

const getGradientVariant = (
  r: number, 
  g: number, 
  b: number, 
  isLightMode: boolean
): string => {
  const factor = isLightMode ? 1.2 : 0.8;
  const clamp = (value: number) => Math.min(Math.max(Math.floor(value), 0), 255);
  
  return `rgb(
    ${clamp(r * factor)}, 
    ${clamp(g * factor)}, 
    ${clamp(b * factor)}
  )`;
};

const getOverlayOpacity = (luminance: number): number => {
  if (luminance < 0.35) return 0.25;
  if (luminance > 0.75) return 0.5;
  return 0.35;
};

const getFallbackBg = (isLightMode: boolean): string => 
  isLightMode 
    ? "bg-gradient-to-br from-gray-200 to-gray-300" 
    : "bg-gradient-to-br from-gray-700 to-gray-800";

const getBackdropSrc = (backdropUrl: string): string => 
  backdropUrl.startsWith("http") 
    ? backdropUrl 
    : `https://image.tmdb.org/t/p/original${backdropUrl}`;

const isValidBackdropUrl = (backdropUrl: string): boolean => 
  Boolean(backdropUrl?.trim() && backdropUrl !== "undefined");

// Custom hook for theme detection
const useThemeDetection = () => {
  const [isLightMode, setIsLightMode] = useState(false);

  const checkLightMode = useCallback(() => {
    const isLight = 
      document.documentElement.classList.contains("light") ||
      window.matchMedia(COLOR_SCHEME_MEDIA_QUERY).matches;
    setIsLightMode(isLight);
  }, []);

  useEffect(() => {
    checkLightMode();

    const mediaQuery = window.matchMedia(COLOR_SCHEME_MEDIA_QUERY);
    
    // Use addEventListener instead of deprecated addListener
    const handleChange = () => checkLightMode();
    mediaQuery.addEventListener("change", handleChange);

    const observer = new MutationObserver(checkLightMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      observer.disconnect();
    };
  }, [checkLightMode]);

  return isLightMode;
};

// Custom hook for color extraction
const useAmbientColor = (
  backdropUrl: string, 
  hasBackdrop: boolean, 
  isLightMode: boolean
) => {
  const [ambientColor, setAmbientColor] = useState("");
  const [gradientColor, setGradientColor] = useState("");
  const [luminance, setLuminance] = useState(0.5);
  const [isExtracting, setIsExtracting] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const colorThiefRef = useRef<ColorThief | null>(null);

  const extractColor = useCallback(() => {
    if (!imgRef.current || isExtracting) return;

    const img = imgRef.current;
    
    // Ensure image is ready for color extraction
    if (img.naturalWidth === 0 || img.naturalHeight === 0) return;

    setIsExtracting(true);

    try {
      if (!colorThiefRef.current) {
        colorThiefRef.current = new ColorThief();
      }

      const [r, g, b] = colorThiefRef.current.getColor(img);
      const lum = calculateLuminance(r, g, b);
      
      setLuminance(lum);
      setAmbientColor(getAdjustedColor(r, g, b, lum, isLightMode));
      setGradientColor(getGradientVariant(r, g, b, isLightMode));
    } catch (error) {
      console.warn("Color extraction failed:", error);
      const fallbackColor = getGrayColor(isLightMode);
      setAmbientColor(fallbackColor);
      setGradientColor(fallbackColor);
      setLuminance(0.5);
    } finally {
      setIsExtracting(false);
    }
  }, [isLightMode, isExtracting]);

  // Reset colors when backdrop changes or theme changes
  useEffect(() => {
    const fallbackColor = getGrayColor(isLightMode);
    setAmbientColor(fallbackColor);
    setGradientColor(fallbackColor);
    setLuminance(0.5);
  }, [backdropUrl, isLightMode]);

  // Setup image load listener
  useEffect(() => {
    if (!hasBackdrop || !imgRef.current) return;

    const img = imgRef.current;

    const handleLoad = () => {
      // Small delay to ensure image is fully rendered
      setTimeout(extractColor, 100);
    };

    if (img.complete) {
      handleLoad();
    } else {
      img.addEventListener("load", handleLoad);
    }

    return () => {
      img.removeEventListener("load", handleLoad);
    };
  }, [hasBackdrop, extractColor]);

  return {
    imgRef,
    ambientColor,
    gradientColor,
    luminance,
    extractColor,
  };
};

export default function Desc({
  data,
  backdropUrl = "",
  isLoading = false,
}: DescProps) {
  const [hasError, setHasError] = useState(false);
  const isLightMode = useThemeDetection();
  
  const hasBackdrop = isValidBackdropUrl(backdropUrl) && !hasError;
  
  const {
    imgRef,
    ambientColor,
    gradientColor,
    luminance,
    extractColor,
  } = useAmbientColor(backdropUrl, hasBackdrop, isLightMode);

  // Memoized style calculations
  const fallbackBg = getFallbackBg(isLightMode);
  const overlayOpacity = getOverlayOpacity(luminance) + 0.1;
  const overlayBg = isLightMode 
    ? `rgba(255,255,255,${overlayOpacity})` 
    : `rgba(0,0,0,${overlayOpacity})`;

  const gradientBg = ambientColor && gradientColor 
    ? `linear-gradient(135deg, ${ambientColor} 30%, ${gradientColor} 100%)`
    : getGrayColor(isLightMode);

  const mediaTitle = data?.title || data?.name || "Media";

  // Handle image error
  const handleImageError = useCallback(() => {
    setHasError(true);
  }, []);

  // Prevent right-click on image
  const handleImageContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Handle successful image load
  const handleImageLoad = useCallback(() => {
    setHasError(false);
  }, []);

  return (
    <section
      className="relative w-full min-h-screen overflow-hidden transition-colors duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ background: gradientBg }}
    >
      {/* Background Layer */}
      <div className="absolute inset-0 overflow-hidden">
        {hasBackdrop ? (
          <>
            <div className="relative w-full h-full">
              <Image
                ref={imgRef}
                src={getBackdropSrc(backdropUrl)}
                alt={`${mediaTitle} backdrop`}
                fill
                quality={BACKDROP_QUALITY}
                priority
                onError={handleImageError}
                onLoad={handleImageLoad}
                onContextMenu={handleImageContextMenu}
                className="object-cover object-center opacity-80 transition-opacity duration-700 ease-in-out"
                sizes="100vw"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              />
            </div>
            <div
              className="absolute inset-0 transition-all duration-700 ease-in-out"
              style={{
                backgroundColor: overlayBg,
                backdropFilter: OVERLAY_BLUR,
              }}
            />
          </>
        ) : (
          <div className={`absolute inset-0 ${fallbackBg}`} />
        )}
      </div>

      {/* Content Layer */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 md:py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-12">
          {/* Poster */}
          <div className="w-full sm:w-4/5 md:w-3/5 lg:w-1/3 xl:w-1/4 mx-auto">
            {isLoading ? <MediaPosterSkeleton /> : <MediaPoster data={data} />}
          </div>

          {/* Info */}
          <div className="w-full lg:w-2/3 xl:w-3/4">
            {isLoading ? <MediaInfoSkeleton /> : <MediaInfo data={data} />}
          </div>
        </div>
      </div>
    </section>
  );
}