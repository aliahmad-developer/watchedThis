"use client";

import Image from "next/image";
import Breadcrumbs from "@/breadCrumb/seo/Breadcrumbs";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import KeywordsSection from "./MediaInfo/KeywordSection";
import MediaPoster from "./mediaPoster";
import MediaInfo from "./MediaInfo/mediaInfo";
import MediaInfoSkeleton from "./MediaInfo/Skeleton/MainInfoSkeleton";
import MediaPosterSkeleton from "./MediaInfo/Skeleton/PosterSkeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faShareNodes,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

interface DescProps {
  data: any;
  backdropUrl?: string;
  isLoading?: boolean;
}

export interface AmbientTextColors {
  primary: string;
  secondary: string;
  muted: string;
}

const COLOR_SCHEME_MEDIA_QUERY = "(prefers-color-scheme: light)";

const BACKDROP_QUALITY = 55;
const BACKDROP_SIZE = "w1280";
const COLOR_SAMPLE_SIZE = "w92";

const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

// ─── pure helpers ─────────────────────────────────────────────────────────────

const calculateLuminance = (r: number, g: number, b: number): number =>
  (0.299 * r + 0.587 * g + 0.114 * b) / 255;

const isValidBackdropUrl = (url: string): boolean =>
  Boolean(url?.trim() && url !== "undefined");

const getTmdbSrc = (url: string, size: string): string =>
  url.startsWith("http") ? url : `https://image.tmdb.org/t/p/${size}${url}`;

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
      luminance: lum,
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

const parseRgbaChannels = (rgba: string): [number, number, number] => {
  const parts = rgba
    .replace(/rgba?\(/, "")
    .split(",")
    .map(Number);
  return [parts[0], parts[1], parts[2]];
};

const contrastRatio = (lumA: number, lumB: number): number => {
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
};

const getEffectiveBgLuminance = (
  rawLuminance: number,
  isLightMode: boolean,
): number => {
  if (isLightMode) return rawLuminance;
  return rawLuminance * 0.25;
};

const getAmbientTextColor = (
  isLightMode: boolean,
  rawRgb: string,
  rawLuminance: number,
): AmbientTextColors => {
  const [r, g, b] = rawRgb.split(",").map(Number);
  const effectiveBgLum = getEffectiveBgLuminance(rawLuminance, isLightMode);
  const useLightText = !isLightMode || effectiveBgLum < 0.45;

  let primary: string;
  let secondary: string;
  let muted: string;

  if (!useLightText) {
    const dp = (v: number) => Math.max(Math.floor(v * 0.28), 0);
    const ds = (v: number) => Math.max(Math.floor(v * 0.48 + 18), 0);
    primary = `rgba(${dp(r)},${dp(g)},${dp(b)},0.92)`;
    secondary = `rgba(${ds(r)},${ds(g)},${ds(b)},0.80)`;
    muted = `rgba(${ds(r)},${ds(g)},${ds(b)},0.50)`;
  } else {
    const lp = (v: number) => Math.min(Math.floor(v * 2.6 + 160), 255);
    const ls = (v: number) => Math.min(Math.floor(v * 2.2 + 110), 255);
    const lm = (v: number) => Math.min(Math.floor(v * 1.8 + 75), 255);
    primary = `rgba(${lp(r)},${lp(g)},${lp(b)},0.95)`;
    secondary = `rgba(${ls(r)},${ls(g)},${ls(b)},0.88)`;
    muted = `rgba(${lm(r)},${lm(g)},${lm(b)},0.55)`;
  }

  const [pr, pg, pb] = parseRgbaChannels(primary);
  const primaryLum = calculateLuminance(pr, pg, pb);
  const ratio = contrastRatio(primaryLum, effectiveBgLum);

  if (ratio < 4.5) {
    const useWhite = effectiveBgLum < 0.5;
    return useWhite
      ? {
          primary: "rgba(255,255,255,0.95)",
          secondary: "rgba(235,235,235,0.82)",
          muted: "rgba(210,210,210,0.50)",
        }
      : {
          primary: "rgba(20,20,20,0.92)",
          secondary: "rgba(20,20,20,0.72)",
          muted: "rgba(20,20,20,0.42)",
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
  const extractingRef = useRef(false);

  const extractColor = useCallback(
    async (img: HTMLImageElement) => {
      if (extractingRef.current || img.naturalWidth === 0) return;
      extractingRef.current = true;
      try {
        const { default: ColorThief } = await import("color-thief-browser");
        const ct = new ColorThief();
        const [r, g, b] = ct.getColor(img);
        setAmbient(buildAmbientColor(r, g, b, isLightMode));
      } catch {
        setAmbient(null);
      } finally {
        extractingRef.current = false;
      }
    },
    [isLightMode],
  );

  useEffect(() => {
    setAmbient(null);
    extractingRef.current = false;
  }, [backdropUrl, isLightMode]);

  useEffect(() => {
    if (!hasBackdrop) return;

    if (!backdropUrl.startsWith("http")) {
      const sampleSrc = getTmdbSrc(backdropUrl, COLOR_SAMPLE_SIZE);
      const img = new window.Image();
      img.crossOrigin = "anonymous";

      const handleLoad = () => extractColor(img);
      const handleError = () => {
        const visible = imgRef.current;
        if (visible?.complete && visible.naturalWidth > 0)
          extractColor(visible);
        else
          visible?.addEventListener("load", () => extractColor(visible!), {
            once: true,
          });
      };

      img.addEventListener("load", handleLoad);
      img.addEventListener("error", handleError);
      img.src = sampleSrc;

      if (img.complete && img.naturalWidth > 0) handleLoad();

      return () => {
        img.removeEventListener("load", handleLoad);
        img.removeEventListener("error", handleError);
      };
    }

    const img = imgRef.current;
    if (!img) return;
    const handleLoad = () => extractColor(img);
    if (img.complete && img.naturalWidth > 0) handleLoad();
    else img.addEventListener("load", handleLoad);
    return () => img.removeEventListener("load", handleLoad);
  }, [hasBackdrop, backdropUrl, extractColor]);

  return { imgRef, ambient };
};

// ─── MediaActions (copy + share FABs) ─────────────────────────────────────────

function MediaActions({
  title,
  rgbColor,
  textScheme,
}: {
  title: string;
  rgbColor: string;
  textScheme: "light" | "dark";
}) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const btnBg =
    textScheme === "light"
      ? `rgba(${rgbColor},0.55)`
      : `rgba(${rgbColor},0.65)`;
  const btnBorder =
    textScheme === "light" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.25)";
  const iconColor =
    textScheme === "light" ? "rgba(255,255,255,0.88)" : "rgba(20,20,20,0.82)";

  const handleCopy = useCallback(async () => {
    if (copied) return;
    try {
      await navigator.clipboard.writeText(title);
      setCopied(true);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = title;
      el.style.cssText = "position:fixed;top:-9999px;left:-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [title, copied]);

  const handleShare = useCallback(async () => {
    const shareData = { title, url: window.location.href };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
      }
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  }, [title]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  const btnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: "0.625rem",
    background: btnBg,
    border: `1px solid ${btnBorder}`,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    color: iconColor,
    cursor: "pointer",
    transition: "transform 150ms ease, opacity 150ms ease",
    flexShrink: 0,
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: "1.25rem",
        right: "1.25rem",
        display: "flex",
        gap: "0.5rem",
        zIndex: 20,
      }}
    >
      <button
        onClick={handleCopy}
        title={copied ? "Copied!" : `Copy title: ${title}`}
        aria-label={copied ? "Copied!" : "Copy title"}
        style={btnStyle}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.92)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <FontAwesomeIcon
          icon={copied ? faCheck : faCopy}
          style={{
            width: "0.875rem",
            height: "0.875rem",
            transition: "opacity 200ms ease",
            color: copied
              ? textScheme === "light"
                ? "rgba(134,239,172,0.95)"
                : "rgba(21,128,61,0.95)"
              : iconColor,
          }}
        />
      </button>

      <button
        onClick={handleShare}
        title="Share"
        aria-label="Share"
        style={btnStyle}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.92)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <FontAwesomeIcon
          icon={faShareNodes}
          style={{ width: "0.875rem", height: "0.875rem" }}
        />
      </button>
    </div>
  );
}

// ─── component ────────────────────────────────────────────────────────────────

export default function Desc({
  data,
  backdropUrl = "",
  isLoading = false,
}: DescProps) {
  const [hasError, setHasError] = useState(false);
  const isLightMode = useThemeDetection();
  const hasBackdrop = isValidBackdropUrl(backdropUrl) && !hasError;
  const { imgRef, ambient } = useAmbientColor(
    backdropUrl,
    hasBackdrop,
    isLightMode,
  );

  const mediaTitle = data?.title || data?.name || "Media";

  const { solidColor, rgbColor } = useMemo(() => {
    const fallbackRgb = isLightMode ? "238,240,242" : "3,25,38";
    const fallbackSolid = isLightMode ? "rgb(238,240,242)" : "rgb(3,25,38)";
    return {
      solidColor: ambient?.solid ?? fallbackSolid,
      rgbColor: ambient?.rgb ?? fallbackRgb,
    };
  }, [ambient, isLightMode]);

  const ambientText: AmbientTextColors = useMemo(() => {
    const rawRgb = ambient?.rawRgb ?? (isLightMode ? "238,240,242" : "3,25,38");
    const rawLuminance = ambient?.luminance ?? (isLightMode ? 0.88 : 0.02);
    return getAmbientTextColor(isLightMode, rawRgb, rawLuminance);
  }, [ambient, isLightMode]);

  const textScheme: "light" | "dark" = useMemo(() => {
    const effectiveLum = getEffectiveBgLuminance(
      ambient?.luminance ?? (isLightMode ? 0.88 : 0.02),
      isLightMode,
    );
    return !isLightMode || effectiveLum < 0.45 ? "light" : "dark";
  }, [ambient, isLightMode]);

  const keywords: { id: number; name: string }[] = useMemo(
    () => data?.keywords?.keywords ?? data?.keywords?.results ?? [],
    [data?.keywords],
  );

  const backdropDisplaySrc = hasBackdrop
    ? getTmdbSrc(backdropUrl, BACKDROP_SIZE)
    : null;

  return (
    <section
      className="relative w-full min-h-screen overflow-hidden"
      style={{
        backgroundColor: solidColor,
        transition: "background-color 700ms ease-in-out",
      }}
    >
      {hasBackdrop && backdropDisplaySrc && (
        <div className="absolute inset-0">
          <Image
            ref={imgRef}
            src={backdropDisplaySrc}
            alt={`${mediaTitle} backdrop`}
            fill
            quality={BACKDROP_QUALITY}
            priority
            fetchPriority="high"
            onError={(e) => {
              if (e.currentTarget.naturalWidth === 0) setHasError(true);
            }}
            onLoad={(e) => {
              if (e.currentTarget.naturalWidth > 0) setHasError(false);
            }}
            onContextMenu={(e) => e.preventDefault()}
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 100vw, 1280px"
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
          {/* Poster */}
          <div className="w-full sm:w-4/5 md:w-3/5 lg:w-1/3 xl:w-1/4 mx-auto">
            {isLoading ? (
              <MediaPosterSkeleton />
            ) : (
              <div className="animate-[fadeUp_0.5s_ease_both]">
                <MediaPoster
                  key={data?.id}
                  data={data}
                  textScheme={textScheme}
                  ambientText={ambientText}
                  priority
                />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="w-full lg:w-2/3 xl:w-3/4">
            {isLoading ? (
              <MediaInfoSkeleton />
            ) : (
              <div
                className="animate-[fadeUp_0.5s_ease_both]"
                style={{ animationDelay: "80ms" }}
              >
                <MediaInfo
                  key={data?.id}
                  data={data}
                  textScheme={textScheme}
                  ambientText={ambientText}
                  rawRgb={ambient?.rawRgb}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keywords strip */}
      {isLoading ? (
        <div className="relative z-10 px-4 sm:px-6 pb-6 animate-pulse">
          <div className="flex flex-wrap gap-2">
            {[52, 72, 44, 64, 48, 80, 56, 40, 68, 60].map((w, i) => (
              <div
                key={i}
                className="h-4 bg-light-border dark:bg-dark-border rounded"
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
        </div>
      ) : keywords.length > 0 ? (
        <div
          className="relative z-10 px-4 sm:px-6 pb-6 animate-[fadeUp_0.5s_ease_both]"
          style={{ animationDelay: "150ms", paddingRight: "6rem" }}
        >
          <KeywordsSection
            keywords={keywords}
            textScheme={textScheme}
            mutedColor={ambientText.muted}
          />
        </div>
      ) : null}

      {/* Copy & Share FABs */}
      {!isLoading && (
        <MediaActions
          title={mediaTitle}
          rgbColor={rgbColor}
          textScheme={textScheme}
        />
      )}
    </section>
  );
}
