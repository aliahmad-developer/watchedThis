"use client";

import { useEffect, useState, useCallback, useRef, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import ColorThief from "color-thief-browser";
import { createSlug } from "../utilities/createSlug";

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
const LOCAL_CACHE_KEY = "dailyMediaCache_v2";

// ── Dedup helper ──────────────────────────────────────────────

const deduped = (items: MediaItem[]): MediaItem[] =>
  items.filter((item, i, arr) => arr.findIndex((x) => x.id === item.id) === i);

// ── Ambient color helpers ─────────────────────────────────────

const COLOR_SCHEME_MEDIA_QUERY = "(prefers-color-scheme: light)";

const calculateLuminance = (r: number, g: number, b: number) =>
  (0.299 * r + 0.587 * g + 0.114 * b) / 255;

interface AmbientColor {
  solid: string;
  rgb: string;
  rawRgb: string;
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
    const clamp = (v: number) => Math.min(Math.floor(v * f + 50), 235);
    return {
      solid: `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`,
      rgb: `${clamp(r)},${clamp(g)},${clamp(b)}`,
      rawRgb: `${r},${g},${b}`,
    };
  } else {
    const f = lum > 0.5 ? 0.2 : lum > 0.3 ? 0.3 : 0.45;
    const clamp = (v: number) => Math.max(Math.floor(v * f), 0);
    return {
      solid: `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`,
      rgb: `${clamp(r)},${clamp(g)},${clamp(b)}`,
      rawRgb: `${r},${g},${b}`,
    };
  }
};

const getContrastText = (
  rawRgb: string,
): { primary: string; secondary: string } => {
  const [r, g, b] = rawRgb.split(",").map(Number);
  const ir = 255 - r;
  const ig = 255 - g;
  const ib = 255 - b;
  const origLum = calculateLuminance(r, g, b);
  const invLum = calculateLuminance(ir, ig, ib);
  const contrast = Math.abs(origLum - invLum);
  if (contrast < 0.3) {
    return {
      primary: origLum > 0.5 ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.95)",
      secondary: origLum > 0.5 ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.65)",
    };
  }
  return {
    primary: `rgba(${ir},${ig},${ib},0.95)`,
    secondary: `rgba(${ir},${ig},${ib},0.65)`,
  };
};

const useThemeDetection = () => {
  const [isLightMode, setIsLightMode] = useState(false);
  const check = useCallback(() => {
    setIsLightMode(
      document.documentElement.classList.contains("light") ||
        window.matchMedia(COLOR_SCHEME_MEDIA_QUERY).matches,
    );
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

// ── Main component ────────────────────────────────────────────

export default function RandomMedia() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOneRandom = useCallback(async (): Promise<MediaItem> => {
    const res = await fetch("/api/randomCall");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || data.error) throw new Error("Invalid data");
    return data as MediaItem;
  }, []);

  // Fetch until we have `n` unique items (by id), with a cap on total attempts
  const fetchNUnique = useCallback(
    async (n: number, existing: MediaItem[] = []): Promise<MediaItem[]> => {
      const seen = new Set(existing.map((x) => x.id));
      const results: MediaItem[] = [];
      const maxAttempts = n * 4; // allow retries to get unique items
      let attempts = 0;

      while (results.length < n && attempts < maxAttempts) {
        attempts++;
        try {
          const item = await fetchOneRandom();
          if (!seen.has(item.id)) {
            seen.add(item.id);
            results.push(item);
          }
        } catch {
          // keep trying until maxAttempts
        }
      }

      if (results.length === 0) throw new Error("All fetches failed");
      return results;
    },
    [fetchOneRandom],
  );

  const loadDailyMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    const today = new Date().toDateString();
    let cancelled = false;

    try {
      // Check localStorage first
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        const parsed: DailyMediaDoc = JSON.parse(cached);
        if (parsed.date === today && parsed.items?.length > 0) {
          if (!cancelled) setMedia(parsed.items);
          return;
        }
      }

      // Hit the API route (which uses Admin SDK)
      const res = await fetch("/api/dailyMedia");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const items: MediaItem[] = json.data;
      localStorage.setItem(
        LOCAL_CACHE_KEY,
        JSON.stringify({ date: today, items }),
      );
      if (!cancelled) setMedia(items);
    } catch (err) {
      console.error("Error loading daily media:", err);
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        const parsed: DailyMediaDoc = JSON.parse(cached);
        if (parsed.items?.length > 0) {
          if (!cancelled) setMedia(parsed.items);
          return;
        }
      }
      if (!cancelled) setError("Failed to load media. Please try again.");
    } finally {
      if (!cancelled) setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadDailyMedia();
  }, [loadDailyMedia]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6 bg-light-bg dark:bg-dark-bg">
        <header className="mb-6">
          <div className="flex mb-6">
            <div className="h-8 bg-gray-200 px-40 rounded w-64 animate-pulse" />
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
      <header className="mb-6">
        <h2 className="px-4 mb-6">Random Media of the Day.</h2>
      </header>

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
              <div className="text-center text-gray-500 p-4 border border-dashed rounded-lg">
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
                className="text-center text-gray-500 p-4 border border-dashed rounded-lg flex items-center justify-center"
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

// ── Cards ─────────────────────────────────────────────────────

interface CardProps {
  item: MediaItem;
  index: number;
}

const FeaturedCard = memo(({ item, index }: CardProps) => {
  const isLightMode = useThemeDetection();
  const hasBackdrop = !!item.backdrop_path;
  const imageUrl = getImageUrl(
    hasBackdrop ? item.backdrop_path : item.poster_path,
    1280,
  );
  const { imgRef, ambient } = useCardAmbient(imageUrl, isLightMode);

  const fallbackRaw = isLightMode ? "50,50,50" : "200,200,200";
  const fallbackSolid = isLightMode ? "rgb(210,210,210)" : "rgb(15,15,15)";
  const solidColor = ambient?.solid ?? fallbackSolid;
  const rgbColor = ambient?.rgb ?? (isLightMode ? "210,210,210" : "15,15,15");
  const textColor = getContrastText(ambient?.rawRgb ?? fallbackRaw);

  const fullTint = `rgba(${rgbColor}, 0.2)`;
  const layerBottom = `linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.45) 20%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0) 65%)`;
  const layerTop = `linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 20%)`;

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
          className={`transition-transform duration-700 scale-100 group-hover:scale-102 object-cover ${hasBackdrop ? "object-center" : "object-top"}`}
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 66vw"
        />
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{ backgroundColor: fullTint }}
        />
        <div className="absolute inset-0" style={{ background: layerBottom }} />
        <div className="absolute inset-0" style={{ background: layerTop }} />
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
  const hasPoster = !!item.poster_path;
  const imageUrl = getImageUrl(
    hasPoster ? item.poster_path : item.backdrop_path,
    500,
  );
  const { imgRef, ambient } = useCardAmbient(imageUrl, isLightMode);

  const fallbackSolid = isLightMode ? "rgb(210,210,210)" : "rgb(15,15,15)";
  const solidColor = ambient?.solid ?? fallbackSolid;
  const rgbColor = ambient?.rgb ?? (isLightMode ? "210,210,210" : "15,15,15");

  const primaryText = "rgba(255,255,255,0.95)";
  const secondaryText = "rgba(255,255,255,0.65)";

  const fullTint = `rgba(${rgbColor}, 0.15)`;
  const layerBottom = `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0) 75%)`;
  const layerTop = `linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 20%)`;

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
          className={`transition-transform duration-700 group-hover:scale-105 ${hasPoster ? "object-cover object-top" : "object-cover object-center"}`}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{ backgroundColor: fullTint }}
        />
        <div className="absolute inset-0" style={{ background: layerBottom }} />
        <div className="absolute inset-0" style={{ background: layerTop }} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <p className="text-xs mb-1" style={{ color: secondaryText }}>
          {getDayLabel(index)}
        </p>
        <h3
          className="text-base font-semibold leading-tight line-clamp-1 mb-1"
          style={{ color: primaryText }}
        >
          {item.title || "Untitled"}
        </h3>
        <p className="text-xs line-clamp-1" style={{ color: secondaryText }}>
          {item.overview || "No description available."}
        </p>
      </div>
    </Link>
  );
});
RightStackCard.displayName = "RightStackCard";

// ── Utilities ─────────────────────────────────────────────────

const getImageUrl = (path?: string | null, width = 1280): string =>
  path
    ? `https://image.tmdb.org/t/p/w${width}${path}`
    : "https://via.placeholder.com/800x450?text=No+Image";

const getDayLabel = (index: number): string => {
  if (index === 0) return "Today";
  if (index === 1) return "Yesterday";
  return `${index} days ago`;
};

// ── Skeletons ─────────────────────────────────────────────────

const FeaturedCardSkeleton = () => (
  <div className="relative w-full h-64 md:h-80 lg:h-full rounded-xl overflow-hidden bg-light-border dark:bg-dark-border animate-pulse">
    <div className="absolute inset-0 bg-linear-to-t from-black/20 via-black/10 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
      <div className="h-4 w-24 bg-gray-400 rounded mb-2" />
      <div className="h-6 w-3/4 bg-gray-400 rounded mb-2" />
      <div className="h-4 w-5/6 bg-gray-400 rounded" />
    </div>
  </div>
);

const RightStackCardSkeleton = () => (
  <div className="relative w-full h-49 rounded-xl overflow-hidden bg-light-border dark:bg-dark-border animate-pulse">
    <div className="absolute inset-0 bg-linear-to-t from-black/20 via-black/10 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <div className="h-3 w-16 bg-gray-400 rounded mb-1" />
      <div className="h-4 w-3/4 bg-gray-400 rounded mb-1" />
      <div className="h-3 w-5/6 bg-gray-400 rounded" />
    </div>
  </div>
);
