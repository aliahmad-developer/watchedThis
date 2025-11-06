"use client";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import ColorThief from "color-thief-browser";
import MediaPoster from "./mediaPoster";
import MediaInfo from "../randomMedia/MediaInfo";
import MediaInfoSkeleton from "./MediaInfo/Skeleton/MainInfoSkeleton";
import MediaPosterSkeleton from "./MediaInfo/Skeleton/PosterSkeleton";

interface DescProps {
  data: any;
  backdropUrl?: string;
  isLoading?: boolean;
}

const COLOR_SCHEME_MEDIA_QUERY = "(prefers-color-scheme: light)";
const GRAY_COLORS = {
  light: "rgb(229,231,235)",
  dark: "rgb(31,41,55)",
} as const;

const getGrayColor = (isLight: boolean) => 
  isLight ? GRAY_COLORS.light : GRAY_COLORS.dark;

const calculateLuminance = (r: number, g: number, b: number) => 
  (0.299 * r + 0.587 * g + 0.114 * b) / 255;

const getAdjustedColor = (r: number, g: number, b: number, luminance: number, isLightMode: boolean) => {
  if (isLightMode) {
    const lightAdjust = luminance > 0.7 ? 0.85 : 0.7;
    return `rgb(${Math.min(r * lightAdjust + 40, 255)}, ${Math.min(g * lightAdjust + 40, 255)}, ${Math.min(b * lightAdjust + 40, 255)})`;
  } else {
    const darkAdjust = luminance < 0.3 ? 0.75 : 0.55;
    return `rgb(${r * darkAdjust}, ${g * darkAdjust}, ${b * darkAdjust})`;
  }
};

const getOverlayOpacity = (luminance: number) => {
  if (luminance < 0.35) return 0.25;
  if (luminance > 0.75) return 0.5;
  return 0.35;
};

const getFallbackBg = (isLightMode: boolean) => 
  isLightMode 
    ? "bg-gradient-to-br from-gray-200 to-gray-300" 
    : "bg-gradient-to-br from-gray-700 to-gray-800";

const getBackdropSrc = (backdropUrl: string) => 
  backdropUrl.startsWith("http") 
    ? backdropUrl 
    : `https://image.tmdb.org/t/p/original${backdropUrl}`;

export default function Desc({
  data,
  backdropUrl = "",
  isLoading = false,
}: DescProps) {
  const [ambientColor, setAmbientColor] = useState("");
  const [hasError, setHasError] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  const [luminance, setLuminance] = useState(0.5);
  const imgRef = useRef<HTMLImageElement>(null);

  const hasBackdrop = Boolean(
    backdropUrl.trim() && backdropUrl !== "undefined" && !hasError
  );

  // Theme detection
  const checkLightMode = useCallback(() => {
    const isLight = 
      document.documentElement.classList.contains("light") ||
      window.matchMedia(COLOR_SCHEME_MEDIA_QUERY).matches;
    setIsLightMode(isLight);
    setAmbientColor(getGrayColor(isLight));
  }, []);

  useEffect(() => {
    checkLightMode();

    const mediaQuery = window.matchMedia(COLOR_SCHEME_MEDIA_QUERY);
    mediaQuery.addEventListener("change", checkLightMode);

    const observer = new MutationObserver(checkLightMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      mediaQuery.removeEventListener("change", checkLightMode);
      observer.disconnect();
    };
  }, [checkLightMode]);

  // Ambient color extraction
  const extractColor = useCallback(() => {
    if (!imgRef.current) return;

    const img = imgRef.current;
    const colorThief = new ColorThief();

    try {
      const [r, g, b] = colorThief.getColor(img);
      const lum = calculateLuminance(r, g, b);
      setLuminance(lum);
      
      const adjustedColor = getAdjustedColor(r, g, b, lum, isLightMode);
      setAmbientColor(adjustedColor);
    } catch {
      setAmbientColor(getGrayColor(isLightMode));
      setLuminance(0.5);
    }
  }, [isLightMode]);

  useEffect(() => {
    if (!hasBackdrop || !imgRef.current) return;

    const img = imgRef.current;

    if (img.complete) {
      extractColor();
    } else {
      img.addEventListener("load", extractColor);
    }

    return () => img.removeEventListener("load", extractColor);
  }, [hasBackdrop, backdropUrl, extractColor]);

  const fallbackBg = getFallbackBg(isLightMode);
  const overlayOpacity = getOverlayOpacity(luminance);
  const overlayBg = isLightMode 
    ? `rgba(255,255,255,${overlayOpacity})` 
    : `rgba(0,0,0,${overlayOpacity})`;

  const mediaTitle = data?.title || data?.name || "Media";

  return (
    <section
      className="relative w-full min-h-screen overflow-hidden transition-colors duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ backgroundColor: ambientColor }}
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
                quality={85}
                priority
                onError={() => setHasError(true)}
                className="object-cover object-center opacity-80 transition-opacity duration-700 ease-in-out"
                sizes="100vw"
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
            <div
              className="absolute inset-0 transition-all duration-700 ease-in-out"
              style={{
                backgroundColor: overlayBg,
                backdropFilter: "blur(3px)",
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