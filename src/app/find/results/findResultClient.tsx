"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ColorThief from "color-thief-browser";
import { createSlug } from "../../components/utilities/createSlug";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

interface MediaResult {
  id: number;
  title: string;
  backdrop_path: string | null;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
  overview: string;
  media_type: string;
  keywords?: string[];
}

const MOVIE_GENRES: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  "Science Fiction": 878,
  Thriller: 53,
  War: 10752,
  Western: 37,
};
const TV_GENRES: Record<string, number> = {
  "Action & Adventure": 10759,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Kids: 10762,
  Mystery: 9648,
  Reality: 10764,
  "Sci-Fi & Fantasy": 10765,
  Western: 37,
};
const ALL_GENRES = { ...MOVIE_GENRES, ...TV_GENRES };

// ── Ambient color helpers ─────────────────────────────────────────────────────
const COLOR_SCHEME_MEDIA_QUERY = "(prefers-color-scheme: light)";

const calculateLuminance = (r: number, g: number, b: number) =>
  (0.299 * r + 0.587 * g + 0.114 * b) / 255;

interface AmbientColor {
  solid: string;
  rgb: string;       // processed — used for gradients & card bg
  rawRgb: string;    // raw dominant — used for text tinting
  luminance: number; // luminance of processed color — used for text flip
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

/**
 * Ambient text color — same logic as RandomMedia.
 *
 * Light mode + bright gradient (lum ≥ 0.45): dark tinted text
 * Light mode + dark gradient  (lum  < 0.45): light tinted text
 * Dark mode (always):                         light tinted text
 */
const getAmbientTextColor = (
  isLightMode: boolean,
  rawRgb: string,
  processedLuminance: number,
) => {
  const [r, g, b] = rawRgb.split(",").map(Number);
  const useLightText = !isLightMode || processedLuminance < 0.45;

  if (!useLightText) {
    // Light mode, bright gradient — dark tinted
    const dp = (v: number) => Math.max(Math.floor(v * 0.28), 0);
    const ds = (v: number) => Math.max(Math.floor(v * 0.48 + 18), 0);
    return {
      primary:   `rgba(${dp(r)},${dp(g)},${dp(b)},0.92)`,
      secondary: `rgba(${ds(r)},${ds(g)},${ds(b)},0.80)`,
      muted:     `rgba(${ds(r)},${ds(g)},${ds(b)},0.55)`,
    };
  } else {
    // Dark gradient (any theme) — light pastel tinted
    const lp = (v: number) => Math.min(Math.floor(v * 2.0 + 140), 255);
    const ls = (v: number) => Math.min(Math.floor(v * 1.8 + 85),  255);
    return {
      primary:   `rgba(${lp(r)},${lp(g)},${lp(b)},0.95)`,
      secondary: `rgba(${ls(r)},${ls(g)},${ls(b)},0.85)`,
      muted:     `rgba(${ls(r)},${ls(g)},${ls(b)},0.50)`,
    };
  }
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
// ─────────────────────────────────────────────────────────────────────────────

export default function FindResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [results, setResults] = useState<MediaResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  const fetchResults = useCallback(
    async (p: number, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(p));
        const res = await fetch(`/api/find?${params.toString()}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setResults((prev) =>
          append ? [...prev, ...data.results] : data.results,
        );
        setTotalPages(data.total_pages);
        setTotalResults(data.total_results);
      } catch {
        setError("Failed to load results. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [searchParams],
  );

  useEffect(() => {
    fetchResults(1, false);
  }, [fetchResults]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchResults(next, true);
  };

  const handleBack = () => {
    const filterParams = new URLSearchParams(searchParams.toString());
    filterParams.delete("page");
    router.push(`/find?${filterParams.toString()}`);
  };

  const mediaType = searchParams.get("mediaType") || "movie";
  const keyword = searchParams.get("keyword") || "";
  const genreIds = searchParams.get("genres")?.split(",").map(Number) || [];
  const genreNames = genreIds
    .map((id) => Object.entries(ALL_GENRES).find(([, v]) => v === id)?.[0])
    .filter(Boolean);
  const minYear = searchParams.get("minYear");
  const maxYear = searchParams.get("maxYear");
  const minRating = searchParams.get("minRating");
  const maxRating = searchParams.get("maxRating");

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="text-center py-2">
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold capitalize">
            {mediaType === "tv" ? "TV Shows" : "Movies"}
            {keyword && (
              <span className="text-light-accent dark:text-dark-accent">
                {" "}
                — "{keyword}"
              </span>
            )}
          </h1>
          {!loading && totalResults > 0 && (
            <p className="text-xs sm:text-sm text-light-secondary-text dark:text-dark-secondary-text mt-1">
              {totalResults.toLocaleString()} results found
            </p>
          )}
        </div>

        {/* Filter chips */}
        {(genreNames.length > 0 || minYear || minRating) && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {genreNames.map((name) => (
              <span
                key={name}
                className="text-10px sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 text-light-accent dark:text-dark-accent border border-light-accent/20 dark:border-dark-accent/20"
              >
                {name}
              </span>
            ))}
            {(minYear || maxYear) && (
              <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-secondary-text dark:text-dark-secondary-text">
                {minYear} – {maxYear}
              </span>
            )}
            {(minRating || maxRating) && (
              <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-secondary-text dark:text-dark-secondary-text">
                ★ {minRating} – {maxRating}
              </span>
            )}
          </div>
        )}

        {/* Results */}
        <div className="space-y-3 sm:space-y-4">
          {loading &&
            results.length === 0 &&
            Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
          {error && (
            <div className="text-center py-16 space-y-3">
              <p className="text-red-500 text-sm">{error}</p>
              <button
                onClick={() => fetchResults(1, false)}
                className="px-6 py-2 rounded-xl bg-light-accent dark:bg-dark-accent text-white text-sm"
              >
                Try again
              </button>
            </div>
          )}
          {!loading && !error && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <FontAwesomeIcon
                icon={faSearch}
                className="h-10 sm:h-12 text-light-accent dark:text-dark-accent opacity-30"
              />
              <p className="text-sm sm:text-base font-semibold">
                No results found
              </p>
              <p className="text-xs sm:text-sm text-light-secondary-text dark:text-dark-secondary-text">
                Try adjusting your filters.
              </p>
              <button
                onClick={handleBack}
                className="mt-2 px-6 py-2 rounded-xl bg-light-accent dark:bg-dark-accent text-white text-sm font-medium"
              >
                Back to filters
              </button>
            </div>
          )}
          {results.map((item) => (
            <ResultCard key={`${item.id}-${item.media_type}`} item={item} />
          ))}
          {loading &&
            results.length > 0 &&
            Array.from({ length: 2 }).map((_, i) => (
              <CardSkeleton key={`more-${i}`} />
            ))}
        </div>

        {/* Pagination */}
        {!loading && results.length > 0 && page < totalPages && (
          <button
            onClick={handleLoadMore}
            className="w-full py-2.5 sm:py-3 rounded-xl border border-light-border dark:border-dark-border text-xs sm:text-sm font-medium transition-colors"
          >
            Load more
          </button>
        )}
        {!loading && results.length > 0 && page >= totalPages && (
          <p className="text-center text-[11px] sm:text-xs text-light-secondary-text dark:text-dark-secondary-text py-4">
            All {totalResults.toLocaleString()} results loaded
          </p>
        )}
      </div>
    </div>
  );
}

function ResultCard({ item }: { item: MediaResult }) {
  const isLightMode = useThemeDetection();

  const genreNames = item.genre_ids
    .slice(0, 4)
    .map((id) => Object.entries(ALL_GENRES).find(([, v]) => v === id)?.[0])
    .filter(Boolean) as string[];

  const imageUrl = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
    : item.poster_path
      ? `https://image.tmdb.org/t/p/w780${item.poster_path}`
      : null;

  const { imgRef, ambient } = useCardAmbient(imageUrl, isLightMode);

  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

  const fallbackRgb = isLightMode ? "210,210,210" : "15,15,15";
  const fallbackSolid = isLightMode ? "rgb(210,210,210)" : "rgb(15,15,15)";
  const solidColor = ambient?.solid ?? fallbackSolid;
  const rgbColor = ambient?.rgb ?? fallbackRgb;
  const rawRgb = ambient?.rawRgb ?? fallbackRgb;
  const processedLuminance = ambient?.luminance ?? (isLightMode ? 0.8 : 0.06);
  const textColor = getAmbientTextColor(isLightMode, rawRgb, processedLuminance);

  const fullTint = `rgba(${rgbColor}, 0.45)`;
  const layerBottom = `linear-gradient(to top, rgba(${rgbColor},1) 0%, rgba(${rgbColor},0.7) 12%, rgba(${rgbColor},0.3) 26%, rgba(${rgbColor},0) 42%)`;
  const layerTop = `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 18%)`;
  const layerCenter = `radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)`;

  return (
    <Link
      href={`/${item.media_type}/${createSlug(item.title)}/${item.id}`}
      className="block group w-full rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-light-border dark:border-dark-border overflow-hidden"
      style={{
        backgroundColor: solidColor,
        transition: "background-color 700ms ease-in-out",
      }}
    >
      <div className="relative w-full aspect-4/3 sm:aspect-16/6 lg:aspect-16/5 overflow-hidden">
        {imageUrl ? (
          <Image
            ref={imgRef}
            src={imageUrl}
            alt={item.title}
            fill
            crossOrigin="anonymous"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1280px"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-gray-700 to-gray-900" />
        )}
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

        {rating && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-light-btn-bg dark:bg-dark-btn-bg backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
            ★ {rating}
          </div>
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12 gap-1">
          <h3
            className="text-base sm:text-2xl lg:text-3xl font-bold text-center drop-shadow-lg line-clamp-2 transition-colors duration-700 leading-snug"
            style={{ color: textColor.primary }}
          >
            {item.title}
          </h3>
          <p
            className="text-[10px] sm:text-sm italic transition-colors duration-700"
            style={{ color: textColor.muted }}
          >
            Click for full details
          </p>
        </div>
      </div>

      {/* Bottom info bar */}
      <div
        className="px-3 sm:px-4 py-2 sm:py-3 space-y-1 transition-all duration-700"
        style={{ backgroundColor: solidColor }}
      >
        {genreNames.length > 0 && (
          <p
            className="text-xs sm:text-sm leading-snug transition-colors duration-700"
            style={{ color: textColor.secondary }}
          >
            {genreNames.join(", ")}
          </p>
        )}
        {item.keywords && item.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {item.keywords.slice(0, 4).map((kw) => (
              <span
                key={kw}
                className="font-mono text-[10px] sm:text-xs tracking-tight transition-colors duration-700"
                style={{ color: textColor.muted }}
              >
                #{kw.toLowerCase().replace(/\s+/g, "-")}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="w-full rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse">
      <div className="aspect-4/3 sm:aspect-16/6 lg:aspect-16/5" />
      <div className="px-3 sm:px-4 py-2 sm:py-3 space-y-2">
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
        <div className="h-2.5 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
      </div>
    </div>
  );
}