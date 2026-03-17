"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

/**
 * Ambient text color object passed to all children.
 * primary   — title-level text (bright tint of dominant color)
 * secondary — label / supporting text (slightly dimmer tint)
 * muted     — hints, keywords, "+more" counters (low-opacity tint)
 */
export interface AmbientTextColors {
  primary: string;
  secondary: string;
  muted: string;
}

const COLOR_SCHEME_MEDIA_QUERY = "(prefers-color-scheme: light)";
const BACKDROP_QUALITY = 55;
const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

// ─── pure helpers ─────────────────────────────────────────────────────────────

const calculateLuminance = (r: number, g: number, b: number): number =>
  (0.299 * r + 0.587 * g + 0.114 * b) / 255;

const isValidBackdropUrl = (url: string): boolean =>
  Boolean(url?.trim() && url !== "undefined");

const getBackdropSrc = (url: string): string =>
  url.startsWith("http") ? url : `https://image.tmdb.org/t/p/original${url}`;

interface AmbientColor {
  solid: string;
  rgb: string;
  rawRgb: string;
  luminance: number;
}

const buildAmbientColor = (
  r: number,
  g: number,
  b: number,
  isLightMode: boolean,
): AmbientColor => {
  const lum = calculateLuminance(r, g, b);
  if (isLightMode) {
    const f = lum < 0.5 ? 1.5 : 1.2;
    const cr = Math.min(Math.floor(r * f + 50), 235);
    const cg = Math.min(Math.floor(g * f + 50), 235);
    const cb = Math.min(Math.floor(b * f + 50), 235);
    return {
      solid: `rgb(${cr},${cg},${cb})`,
      rgb: `${cr},${cg},${cb}`,
      rawRgb: `${r},${g},${b}`,
      luminance: calculateLuminance(cr, cg, cb),
    };
  }
  const f = lum > 0.5 ? 0.2 : lum > 0.3 ? 0.3 : 0.45;
  const cr = Math.max(Math.floor(r * f), 0);
  const cg = Math.max(Math.floor(g * f), 0);
  const cb = Math.max(Math.floor(b * f), 0);
  return {
    solid: `rgb(${cr},${cg},${cb})`,
    rgb: `${cr},${cg},${cb}`,
    rawRgb: `${r},${g},${b}`,
    luminance: lum,
  };
};

/**
 * Extracts the rgb channel values from an rgba(...) string.
 * e.g. "rgba(180,120,90,0.95)" → [180, 120, 90]
 */
const parseRgbaChannels = (rgba: string): [number, number, number] => {
  const parts = rgba.replace(/rgba?\(/, "").split(",").map(Number);
  return [parts[0], parts[1], parts[2]];
};

/**
 * WCAG contrast ratio between two luminance values.
 */
const contrastRatio = (lumA: number, lumB: number): number => {
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Computes tinted rgba text colors from the dominant color.
 *
 * Light mode + bright bg (lum ≥ 0.45): very dark tint  (readable on pale bg)
 * Light mode + dark  bg (lum  < 0.45): bright pastel   (readable on dark bg)
 * Dark  mode (always):                  bright pastel   (readable on dark bg)
 *
 * If the computed primary color has contrast ratio < 3.5 against the
 * background, the whole set falls back to safe near-white or near-black
 * so that desaturated / mid-tone backdrops (e.g. brownish-grey) remain
 * readable.
 */
const getAmbientTextColor = (
  isLightMode: boolean,
  rawRgb: string,
  processedLuminance: number,
): AmbientTextColors => {
  const [r, g, b] = rawRgb.split(",").map(Number);
  const useLightText = !isLightMode || processedLuminance < 0.45;

  let primary: string;
  let secondary: string;
  let muted: string;

  if (!useLightText) {
    // Light mode, bright background — dark tinted text
    const dp = (v: number) => Math.max(Math.floor(v * 0.28), 0);
    const ds = (v: number) => Math.max(Math.floor(v * 0.48 + 18), 0);
    primary   = `rgba(${dp(r)},${dp(g)},${dp(b)},0.92)`;
    secondary = `rgba(${ds(r)},${ds(g)},${ds(b)},0.80)`;
    muted     = `rgba(${ds(r)},${ds(g)},${ds(b)},0.50)`;
  } else {
    // Dark background (any theme) — light pastel tinted text
    const lp = (v: number) => Math.min(Math.floor(v * 2.0 + 140), 255);
    const ls = (v: number) => Math.min(Math.floor(v * 1.8 + 85), 255);
    primary   = `rgba(${lp(r)},${lp(g)},${lp(b)},0.95)`;
    secondary = `rgba(${ls(r)},${ls(g)},${ls(b)},0.85)`;
    muted     = `rgba(${ls(r)},${ls(g)},${ls(b)},0.50)`;
  }

  // ── contrast safety net ───────────────────────────────────────────────────
  // On desaturated / mid-tone backdrops the ambient colors can collapse into
  // the bg and become unreadable. Check the primary contrast ratio against
  // the processed background luminance; if it's below 3.5 fall back to safe
  // near-white or near-black (whichever gives contrast) while preserving the
  // light/dark direction so it never looks jarring.
  const [pr, pg, pb] = parseRgbaChannels(primary);
  const primaryLum = calculateLuminance(pr, pg, pb);
  const ratio = contrastRatio(primaryLum, processedLuminance);

  if (ratio < 3.5) {
    const useWhite = processedLuminance < 0.5;
    return useWhite
      ? {
          primary:   "rgba(255,255,255,0.95)",
          secondary: "rgba(255,255,255,0.75)",
          muted:     "rgba(255,255,255,0.45)",
        }
      : {
          primary:   "rgba(20,20,20,0.92)",
          secondary: "rgba(20,20,20,0.70)",
          muted:     "rgba(20,20,20,0.40)",
        };
  }

  return { primary, secondary, muted };
};

// ─── hooks ────────────────────────────────────────────────────────────────────

const useThemeDetection = () => {
  const [isLightMode, setIsLightMode] = useState(false);

  const checkLightMode = useCallback(() => {
    setIsLightMode(
      document.documentElement.classList.contains("light") ||
        window.matchMedia(COLOR_SCHEME_MEDIA_QUERY).matches,
    );
  }, []);

  useEffect(() => {
    checkLightMode();
    const mq = window.matchMedia(COLOR_SCHEME_MEDIA_QUERY);
    mq.addEventListener("change", checkLightMode);
    const obs = new MutationObserver(checkLightMode);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      mq.removeEventListener("change", checkLightMode);
      obs.disconnect();
    };
  }, [checkLightMode]);

  return isLightMode;
};

const useAmbientColor = (
  backdropUrl: string,
  hasBackdrop: boolean,
  isLightMode: boolean,
) => {
  const [ambient, setAmbient] = useState<AmbientColor | null>(null);
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

  useEffect(() => {
    setAmbient(null);
  }, [backdropUrl, isLightMode]);

  useEffect(() => {
    if (!hasBackdrop || !imgRef.current) return;
    const img = imgRef.current;
    const handleLoad = () => extractColor();
    if (img.complete && img.naturalWidth > 0) handleLoad();
    else img.addEventListener("load", handleLoad);
    return () => img.removeEventListener("load", handleLoad);
  }, [hasBackdrop, extractColor]);

  return { imgRef, ambient };
};

// ─── component ────────────────────────────────────────────────────────────────

export default function Desc({ data, backdropUrl = "", isLoading = false }: DescProps) {
  const [hasError, setHasError] = useState(false);
  const isLightMode = useThemeDetection();
  const hasBackdrop = isValidBackdropUrl(backdropUrl) && !hasError;
  const { imgRef, ambient } = useAmbientColor(backdropUrl, hasBackdrop, isLightMode);

  const mediaTitle = data?.title || data?.name || "Media";

  const { solidColor, rgbColor } = useMemo(() => {
    const fallbackRgb = isLightMode ? "210,210,210" : "15,15,15";
    const fallbackSolid = isLightMode ? "rgb(210,210,210)" : "rgb(15,15,15)";
    return {
      solidColor: ambient?.solid ?? fallbackSolid,
      rgbColor: ambient?.rgb ?? fallbackRgb,
    };
  }, [ambient, isLightMode]);

  /**
   * ambientText — the tinted rgba color set derived from the dominant backdrop
   * color. Passed to all children so every piece of text (titles, labels,
   * overviews, keywords) carries a hint of the image's color rather than being
   * plain white or black.
   */
  const ambientText: AmbientTextColors = useMemo(() => {
    const rawRgb = ambient?.rawRgb ?? (isLightMode ? "210,210,210" : "15,15,15");
    const processedLuminance = ambient?.luminance ?? (isLightMode ? 0.8 : 0.06);
    return getAmbientTextColor(isLightMode, rawRgb, processedLuminance);
  }, [ambient, isLightMode]);

  // textScheme is still passed for components that use it for non-color logic
  // (e.g. scroll box background shade)
  const textScheme: "light" | "dark" = useMemo(() => {
    const processedLuminance = ambient?.luminance ?? (isLightMode ? 0.8 : 0.06);
    return !isLightMode || processedLuminance < 0.45 ? "light" : "dark";
  }, [ambient, isLightMode]);

  const keywords: { id: number; name: string }[] = useMemo(
    () => data?.keywords?.keywords ?? data?.keywords?.results ?? [],
    [data?.keywords],
  );

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
            onError={(e) => {
              if (e.currentTarget.naturalWidth === 0) setHasError(true);
            }}
            onLoad={(e) => {
              if (e.currentTarget.naturalWidth > 0) setHasError(false);
            }}
            onContextMenu={(e) => e.preventDefault()}
            className="object-cover object-center"
            sizes="100vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: `rgba(${rgbColor},0.55)`,
              transition: "background-color 700ms ease-in-out",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, rgba(${rgbColor},1) 0%, rgba(${rgbColor},1) 20%, rgba(${rgbColor},0.85) 35%, rgba(${rgbColor},0.5) 50%, rgba(${rgbColor},0.15) 68%, rgba(${rgbColor},0) 82%)`,
              transition: "background 700ms ease-in-out",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, rgba(${rgbColor},1) 0%, rgba(${rgbColor},0.7) 10%, rgba(${rgbColor},0.3) 22%, rgba(${rgbColor},0) 38%)`,
              transition: "background 700ms ease-in-out",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 15%)`,
            }}
          />
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 md:py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-12">
          <div className="w-full sm:w-4/5 md:w-3/5 lg:w-1/3 xl:w-1/4 mx-auto">
            {isLoading ? (
              <MediaPosterSkeleton />
            ) : (
              <MediaPoster data={data} textScheme={textScheme} ambientText={ambientText} />
            )}
          </div>
          <div className="w-full lg:w-2/3 xl:w-3/4">
            {isLoading ? (
              <MediaInfoSkeleton />
            ) : (
              <MediaInfo data={data} textScheme={textScheme} ambientText={ambientText} />
            )}
          </div>
        </div>
      </div>

      {/* Keywords strip */}
      {!isLoading && keywords.length > 0 && (
        <div className="relative z-10 px-4 sm:px-6 pb-6">
          <KeywordsSection
            keywords={keywords}
            textScheme={textScheme}
            mutedColor={ambientText.muted}
          />
        </div>
      )}
    </section>
  );
}