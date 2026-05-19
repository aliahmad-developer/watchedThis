"use client";

import { useEffect, useState, useCallback, useRef, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ColorThief from "color-thief-browser";
import { createSlug } from "../utilities/createSlug";
import { faDice } from "@fortawesome/free-solid-svg-icons";
import { tmdbImage } from "@/lib/imageTmdb";

interface MediaItem {
  id: number;
  title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  media_type?: string;
}

interface DailyMediaDoc {
  date: string;
  items: MediaItem[];
}

interface Props {
  initialItems?: MediaItem[];
}

const LOCAL_CACHE_KEY = "dailyMediaCache_v2";
const COLOR_SCHEME_MEDIA_QUERY = "(prefers-color-scheme: light)";

const calculateLuminance = (r: number, g: number, b: number) =>
  (0.299 * r + 0.587 * g + 0.114 * b) / 255;

interface AmbientColor {
  solid: string;
  rgb: string;
  rawRgb: string;
  luminance: number;
}

const getAmbientTextColor = (
  isLightMode: boolean,
  rawRgb: string,
  processedLuminance: number,
) => {
  const [r, g, b] = rawRgb.split(",").map(Number);
  const useLightText = !isLightMode || processedLuminance < 0.45;

  if (!useLightText) {
    const dp = (v: number) => Math.max(Math.floor(v * 0.28), 0);
    const ds = (v: number) => Math.max(Math.floor(v * 0.48 + 18), 0);
    return {
      primary: `rgba(${dp(r)},${dp(g)},${dp(b)},0.92)`,
      secondary: `rgba(${ds(r)},${ds(g)},${ds(b)},0.80)`,
    };
  } else {
    const lp = (v: number) => Math.min(Math.floor(v * 2.0 + 140), 255);
    const ls = (v: number) => Math.min(Math.floor(v * 1.8 + 85), 255);
    return {
      primary: `rgba(${lp(r)},${lp(g)},${lp(b)},0.95)`,
      secondary: `rgba(${ls(r)},${ls(g)},${ls(b)},0.85)`,
    };
  }
};

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
  } else {
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
  }
};

const useThemeDetection = () => {
  const [isLightMode, setIsLightMode] = useState(false);
  const check = useCallback(() => {
    setIsLightMode(!document.documentElement.classList.contains("dark"));
  }, []);
  useEffect(() => {
    check();
    const mq = window.matchMedia(COLOR_SCHEME_MEDIA_QUERY);
    mq.addEventListener("change", check);
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      mq.removeEventListener("change", check);
      obs.disconnect();
    };
  }, [check]);
  return isLightMode;
};

const useCardAmbient = (imageUrl: string | null, isLightMode: boolean) => {
  const [ambient, setAmbient] = useState<AmbientColor | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const extractingRef = useRef(false);

  const extract = useCallback(() => {
    if (!imgRef.current || extractingRef.current) return;
    const img = imgRef.current;
    if (img.naturalWidth === 0) return;
    extractingRef.current = true;
    try {
      const ct = new ColorThief();
      const [r, g, b] = ct.getColor(img);
      setAmbient(buildAmbientColor(r, g, b, isLightMode));
    } catch {
      setAmbient(null);
    } finally {
      extractingRef.current = false;
    }
  }, [isLightMode]);

  useEffect(() => {
    setAmbient(null);
  }, [imageUrl, isLightMode]);

  useEffect(() => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const handle = () => setTimeout(extract, 80);
    if (img.complete) {
      handle();
    } else {
      img.addEventListener("load", handle);
    }
    return () => img.removeEventListener("load", handle);
  }, [extract, imageUrl]);

  return { imgRef, ambient };
};

// ── Main component ───────────────────────────────────────────────────────────

export default function DailyMedia({ initialItems = [] }: Props) {
  const [media, setMedia] = useState<MediaItem[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [error, setError] = useState<string | null>(null);

  const loadDailyMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    const today = new Date().toDateString();
    try {
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        const parsed: DailyMediaDoc = JSON.parse(cached);
        if (parsed.date === today && parsed.items?.length > 0) {
          setMedia(parsed.items);
          return;
        }
      }
      const res = await fetch("/api/dailyMedia");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      localStorage.setItem(
        LOCAL_CACHE_KEY,
        JSON.stringify({ date: today, items: json.data }),
      );
      setMedia(json.data);
    } catch (err) {
      console.error("Error loading daily media:", err);
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        const parsed: DailyMediaDoc = JSON.parse(cached);
        if (parsed.items?.length > 0) {
          setMedia(parsed.items);
          return;
        }
      }
      // Only show error if we have no data at all (not even initialItems)
      if (media.length === 0)
        setError("Failed to load media. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [media.length]);

  useEffect(() => {
    // Only fetch client-side if server didn't provide data
    if (initialItems.length === 0) loadDailyMedia();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6 bg-light-bg dark:bg-dark-bg">
        <header className="mb-6">
          <div className="flex mb-6">
            <div className="h-8 bg-light-card dark:bg-dark-card px-40 rounded w-64 animate-pulse" />
          </div>
        </header>
        <div className="hidden lg:grid grid-cols-3 gap-2 min-h-100">
          <div className="col-span-2">
            <FeaturedCardSkeleton />
          </div>
          <div className="flex flex-col gap-2">
            <RightStackCardSkeleton />
            <RightStackCardSkeleton />
          </div>
        </div>
        <div className="hidden md:block lg:hidden space-y-4">
          <FeaturedCardSkeleton />
          <div className="grid grid-cols-2 gap-2">
            <RightStackCardSkeleton />
            <RightStackCardSkeleton />
          </div>
        </div>
        <div className="block md:hidden">
          <FeaturedCardSkeleton />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 bg-light-bg dark:bg-dark-bg text-center">
        <p className="text-light-accent dark:text-dark-accent font-semibold">
          {error}
        </p>
        <button
          onClick={loadDailyMedia}
          className="rounded-lg bg-light-btn-bg dark:bg-dark-btn-bg text-light-btn-text dark:text-dark-btn-text px-6 py-2 transition hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 bg-light-bg dark:bg-dark-bg">
      <div className="flex items-center gap-2 mb-6 px-1">
        <FontAwesomeIcon
          icon={faDice}
          className="text-light-accent dark:text-dark-accent ml-1"
          style={{ width: "1.5rem", height: "1.5rem" }}
        />
        <h2>Random Media of the day</h2>
      </div>

      {/* Desktop (≥1024px) */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-3 gap-2 min-h-75">
          <div className="col-span-2">
            {media[0] && <FeaturedCard item={media[0]} index={0} />}
          </div>
          <div className="flex flex-col space-y-2">
            {media.slice(1, 3).map((item, index) => (
              <RightStackCard
                key={`${item.id}-${index + 1}`}
                item={item}
                index={index + 1}
              />
            ))}
            {media.length < 3 && (
              <div className="text-center text-light-secondary-text dark:text-dark-secondary-text p-4 border border-dashed border-light-border dark:border-dark-border rounded-lg">
                More recommendations coming soon
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tablet (768–1023px) */}
      <div className="hidden md:flex lg:hidden flex-col gap-2">
        {media[0] && <FeaturedCard item={media[0]} index={0} />}
        <div className="grid grid-cols-2 gap-2">
          {media.slice(1, 3).map((item, index) => (
            <RightStackCard
              key={`${item.id}-${index + 1}`}
              item={item}
              index={index + 1}
            />
          ))}
          {media.length < 3 &&
            Array.from({ length: 2 - (media.length - 1) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="text-center text-light-secondary-text dark:text-dark-secondary-text p-4 border border-dashed border-light-border dark:border-dark-border rounded-lg flex items-center justify-center"
              >
                Coming soon
              </div>
            ))}
        </div>
      </div>

      {/* Mobile (<768px) */}
      <div className="block md:hidden">
        {media[0] && <FeaturedCard item={media[0]} index={0} />}
      </div>
    </section>
  );
}

// ── Cards ────────────────────────────────────────────────────────────────────

interface CardProps {
  item: MediaItem;
  index: number;
}

const FALLBACK_LIGHT = {
  rgb: "238,240,242",
  solid: "rgb(238,240,242)",
  luminance: 0.88,
};
const FALLBACK_DARK = {
  rgb: "3,25,38",
  solid: "rgb(3,25,38)",
  luminance: 0.02,
};

const FeaturedCard = memo(({ item, index }: CardProps) => {
  const isLightMode = useThemeDetection();
  const hasBackdrop = !!item.backdrop_path;
  const imageUrl = getImageUrl(
    hasBackdrop ? item.backdrop_path : item.poster_path,
    1280,
  );
  const { imgRef, ambient } = useCardAmbient(imageUrl, isLightMode);

  const fb = isLightMode ? FALLBACK_LIGHT : FALLBACK_DARK;
  const solidColor = ambient?.solid ?? fb.solid;
  const rgbColor = ambient?.rgb ?? fb.rgb;
  const rawRgb = ambient?.rawRgb ?? fb.rgb;
  const processedLuminance = ambient?.luminance ?? fb.luminance;
  const textColor = getAmbientTextColor(
    isLightMode,
    rawRgb,
    processedLuminance,
  );

  const fullTint = `rgba(${rgbColor}, 0.25)`;
  const layerBottom = `linear-gradient(to top, rgba(${rgbColor},1) 0%, rgba(${rgbColor},0.85) 18%, rgba(${rgbColor},0.4) 36%, rgba(${rgbColor},0) 55%)`;
  const layerTop = `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 18%)`;
  const layerCenter = `radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)`;

  return (
    <div
      className="relative w-full h-64 md:h-80 lg:h-full rounded-xl overflow-hidden group border border-light-border dark:border-dark-border shadow-lg"
      style={{
        backgroundColor: solidColor,
        transition: "background-color 700ms ease-in-out",
      }}
    >
      <div className="absolute inset-0">
        <Image
          ref={imgRef}
          src={imageUrl}
          alt={item.title || "Media"}
          fill
          draggable={false}
          crossOrigin="anonymous"
          className={`select-none transition-transform duration-700 scale-100 group-hover:scale-102 object-cover ${hasBackdrop ? "object-center" : "object-top"}`}
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 66vw"
        />
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{ backgroundColor: fullTint }}
        />
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{ background: layerBottom }}
        />
        <div className="absolute inset-0" style={{ background: layerTop }} />
        <div className="absolute inset-0" style={{ background: layerCenter }} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 z-10">
        <p
          className="text-xs mb-1 transition-colors duration-700"
          style={{ color: textColor.secondary }}
        >
          {getDayLabel(index)}
        </p>
        <h2
          className="text-lg md:text-xl lg:text-2xl font-semibold leading-tight line-clamp-2 mb-2 transition-colors duration-700"
          style={{ color: textColor.primary }}
        >
          {item.title || "Untitled"}
        </h2>
        <p
          className="text-sm line-clamp-2 mb-4 transition-colors duration-700"
          style={{ color: textColor.secondary }}
        >
          {item.overview || "No description available."}
        </p>
        <Link
          href={`/${item.media_type || "movie"}/${createSlug(item.title || "")}/${item.id}`}
          className="inline-block text-sm hover:scale-105 transition-all duration-300 ease-in-out"
          style={{ color: textColor.secondary }}
        >
          View details
        </Link>
      </div>
    </div>
  );
});
FeaturedCard.displayName = "FeaturedCard";

const RightStackCard = memo(({ item, index }: CardProps) => {
  const isLightMode = useThemeDetection();
  const hasBackdrop = !!item.backdrop_path;
  const imageUrl = getImageUrl(
    hasBackdrop ? item.backdrop_path : item.poster_path,
    780,
  );
  const { imgRef, ambient } = useCardAmbient(imageUrl, isLightMode);

  const fb = isLightMode ? FALLBACK_LIGHT : FALLBACK_DARK;
  const solidColor = ambient?.solid ?? fb.solid;
  const rgbColor = ambient?.rgb ?? fb.rgb;
  const rawRgb = ambient?.rawRgb ?? fb.rgb;
  const processedLuminance = ambient?.luminance ?? fb.luminance;
  const textColor = getAmbientTextColor(
    isLightMode,
    rawRgb,
    processedLuminance,
  );

  const fullTint = `rgba(${rgbColor}, 0.25)`;
  const layerBottom = `linear-gradient(to top, rgba(${rgbColor},1) 0%, rgba(${rgbColor},0.85) 18%, rgba(${rgbColor},0.4) 36%, rgba(${rgbColor},0) 55%)`;
  const layerTop = `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 18%)`;
  const layerCenter = `radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)`;

  return (
    <Link
      href={`/${item.media_type || "movie"}/${createSlug(item.title || "")}/${item.id}`}
      className="relative w-full h-49 rounded-xl overflow-hidden group border border-light-border dark:border-dark-border shadow-md hover:shadow-lg transition-shadow"
      style={{
        backgroundColor: solidColor,
        transition: "background-color 700ms ease-in-out",
      }}
    >
      <div className="absolute inset-0">
        <Image
          ref={imgRef}
          src={imageUrl}
          alt={item.title || "Media"}
          fill
          crossOrigin="anonymous"
          className="select-none transition-transform duration-700 group-hover:scale-105 object-cover object-center"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{ backgroundColor: fullTint }}
        />
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{ background: layerBottom }}
        />
        <div className="absolute inset-0" style={{ background: layerTop }} />
        <div className="absolute inset-0" style={{ background: layerCenter }} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <p
          className="text-xs mb-1 transition-colors duration-700"
          style={{ color: textColor.primary }}
        >
          {getDayLabel(index)}
        </p>
        <h3
          className="text-base font-semibold leading-tight line-clamp-1 mb-1 transition-colors duration-700"
          style={{ color: textColor.primary }}
        >
          {item.title || "Untitled"}
        </h3>
        <p
          className="text-xs line-clamp-1 transition-colors duration-700"
          style={{ color: textColor.secondary }}
        >
          {item.overview || "No description available."}
        </p>
      </div>
    </Link>
  );
});
RightStackCard.displayName = "RightStackCard";

// ── Utilities ────────────────────────────────────────────────────────────────

const getImageUrl = (path?: string | null, width = 1280): string =>
  tmdbImage(path ?? null, `w${width}`) ?? "/placeholder.jpg";

const getDayLabel = (index: number): string => {
  if (index === 0) return "Today";
  if (index === 1) return "Yesterday";
  return `${index} days ago`;
};

// ── Skeletons ────────────────────────────────────────────────────────────────

const FeaturedCardSkeleton = () => (
  <div className="relative w-full h-64 md:h-80 lg:h-full rounded-xl overflow-hidden bg-light-card dark:bg-dark-card animate-pulse">
    <div className="absolute inset-0 bg-linear-to-t from-black/20 via-black/10 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
      <div className="h-4 w-24 bg-light-border dark:bg-dark-border rounded mb-2" />
      <div className="h-6 w-3/4 bg-light-border dark:bg-dark-border rounded mb-2" />
      <div className="h-4 w-5/6 bg-light-border dark:bg-dark-border rounded" />
    </div>
  </div>
);

const RightStackCardSkeleton = () => (
  <div className="relative w-full h-49 rounded-xl overflow-hidden bg-light-card dark:bg-dark-card animate-pulse">
    <div className="absolute inset-0 bg-linear-to-t from-black/20 via-black/10 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <div className="h-3 w-16 bg-light-border dark:bg-dark-border rounded mb-1" />
      <div className="h-4 w-3/4 bg-light-border dark:bg-dark-border rounded mb-1" />
      <div className="h-3 w-5/6 bg-light-border dark:bg-dark-border rounded" />
    </div>
  </div>
);
