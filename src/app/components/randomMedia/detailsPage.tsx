"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import ColorThief from "color-thief-browser";
import KeywordsSection from "./MediaInfo/KeywordSection";
import MediaPoster from "./mediaPoster";
import MediaInfo from "./MediaInfo/mediaInfo";
import MediaInfoSkeleton from "./MediaInfo/Skeleton/MainInfoSkeleton";
import MediaPosterSkeleton from "./MediaInfo/Skeleton/PosterSkeleton";

interface DescProps {
  data: any;
  backdropUrl?: string;
  isLoading?: boolean;
}

const COLOR_SCHEME_MEDIA_QUERY = "(prefers-color-scheme: light)";
const BACKDROP_QUALITY = 85;

const calculateLuminance = (r: number, g: number, b: number): number =>
  (0.299 * r + 0.587 * g + 0.114 * b) / 255;

const isValidBackdropUrl = (url: string): boolean =>
  Boolean(url?.trim() && url !== "undefined");

const getBackdropSrc = (url: string): string =>
  url.startsWith("http") ? url : `https://image.tmdb.org/t/p/original${url}`;

const buildAmbientColor = (
  r: number, g: number, b: number, isLightMode: boolean,
): { solid: string; rgb: string } => {
  const lum = calculateLuminance(r, g, b);
  if (isLightMode) {
    const f = lum < 0.5 ? 1.5 : 1.2;
    const clamp = (v: number) => Math.min(Math.floor(v * f + 50), 235);
    return { solid: `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`, rgb: `${clamp(r)}, ${clamp(g)}, ${clamp(b)}` };
  } else {
    const f = lum > 0.5 ? 0.2 : lum > 0.3 ? 0.3 : 0.45;
    const clamp = (v: number) => Math.max(Math.floor(v * f), 0);
    return { solid: `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`, rgb: `${clamp(r)}, ${clamp(g)}, ${clamp(b)}` };
  }
};

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
    const mq = window.matchMedia(COLOR_SCHEME_MEDIA_QUERY);
    mq.addEventListener("change", checkLightMode);
    const obs = new MutationObserver(checkLightMode);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => { mq.removeEventListener("change", checkLightMode); obs.disconnect(); };
  }, [checkLightMode]);
  return isLightMode;
};

const useAmbientColor = (backdropUrl: string, hasBackdrop: boolean, isLightMode: boolean) => {
  const [ambient, setAmbient] = useState<{ solid: string; rgb: string } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const colorThiefRef = useRef<ColorThief | null>(null);
  const extractingRef = useRef(false);

  const extractColor = useCallback(() => {
    if (!imgRef.current || extractingRef.current) return;
    const img = imgRef.current;
    if (img.naturalWidth === 0) return;
    extractingRef.current = true;
    try {
      if (!colorThiefRef.current) colorThiefRef.current = new ColorThief();
      const [r, g, b] = colorThiefRef.current.getColor(img);
      setAmbient(buildAmbientColor(r, g, b, isLightMode));
    } catch {
      setAmbient(null);
    } finally {
      extractingRef.current = false;
    }
  }, [isLightMode]);

  useEffect(() => { setAmbient(null); }, [backdropUrl, isLightMode]);

  useEffect(() => {
    if (!hasBackdrop || !imgRef.current) return;
    const img = imgRef.current;
    const handleLoad = () => setTimeout(extractColor, 100);
    if (img.complete) { handleLoad(); } else { img.addEventListener("load", handleLoad); }
    return () => img.removeEventListener("load", handleLoad);
  }, [hasBackdrop, extractColor]);

  return { imgRef, ambient };
};

export default function Desc({ data, backdropUrl = "", isLoading = false }: DescProps) {
  const [hasError, setHasError] = useState(false);
  const isLightMode = useThemeDetection();
  const hasBackdrop = isValidBackdropUrl(backdropUrl) && !hasError;
  const { imgRef, ambient } = useAmbientColor(backdropUrl, hasBackdrop, isLightMode);

  const mediaTitle = data?.title || data?.name || "Media";

  const fallbackRgb = isLightMode ? "210,210,210" : "15,15,15";
  const fallbackSolid = isLightMode ? "rgb(210,210,210)" : "rgb(15,15,15)";
  const solidColor = ambient?.solid ?? fallbackSolid;
  const rgbColor = ambient?.rgb ?? fallbackRgb;

  const fullTint = `rgba(${rgbColor}, 0.55)`;
  const layerLeft = `linear-gradient(to right, rgba(${rgbColor}, 1) 0%, rgba(${rgbColor}, 1) 20%, rgba(${rgbColor}, 0.85) 35%, rgba(${rgbColor}, 0.5) 50%, rgba(${rgbColor}, 0.15) 68%, rgba(${rgbColor}, 0) 82%)`;
  const layerBottom = `linear-gradient(to top, rgba(${rgbColor}, 1) 0%, rgba(${rgbColor}, 0.7) 10%, rgba(${rgbColor}, 0.3) 22%, rgba(${rgbColor}, 0) 38%)`;
  const layerTop = `linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 15%)`;

  const textScheme: "light" | "dark" = isLightMode ? "dark" : "light";

  const keywords: { id: number; name: string }[] =
    data?.keywords?.keywords ?? data?.keywords?.results ?? [];

  return (
    <section
      className="relative w-full min-h-screen overflow-hidden"
      style={{ backgroundColor: solidColor, transition: "background-color 700ms ease-in-out" }}
    >
      {hasBackdrop && (
        <div className="absolute inset-0">
          <Image
            ref={imgRef}
            src={getBackdropSrc(backdropUrl)}
            alt={`${mediaTitle} backdrop`}
            fill
            quality={BACKDROP_QUALITY}
            priority
            onError={() => setHasError(true)}
            onLoad={() => setHasError(false)}
            onContextMenu={(e) => e.preventDefault()}
            className="object-cover object-center"
            sizes="100vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
          <div className="absolute inset-0" style={{ backgroundColor: fullTint, transition: "background-color 700ms ease-in-out" }} />
          <div className="absolute inset-0" style={{ background: layerLeft, transition: "background 700ms ease-in-out" }} />
          <div className="absolute inset-0" style={{ background: layerBottom, transition: "background 700ms ease-in-out" }} />
          <div className="absolute inset-0" style={{ background: layerTop }} />
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 md:py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-12">
          <div className="w-full sm:w-4/5 md:w-3/5 lg:w-1/3 xl:w-1/4 mx-auto">
            {isLoading ? <MediaPosterSkeleton /> : <MediaPoster data={data} textScheme={textScheme} />}
          </div>
          <div className="w-full lg:w-2/3 xl:w-3/4">
            {isLoading ? <MediaInfoSkeleton /> : <MediaInfo data={data} textScheme={textScheme} />}
          </div>
        </div>
      </div>

      {/* Keywords strip — bottom of backdrop */}
      {!isLoading && keywords.length > 0 && (
        <div className="relative z-10 px-4 sm:px-6 pb-6">
          <KeywordsSection keywords={keywords} />
        </div>
      )}
    </section>
  );
}