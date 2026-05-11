"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ColorThief from "color-thief-browser";
import { createSlug } from "../components/utilities/createSlug";
import SceneCameraModal from "../components/sceneDetection/cameraModal";
import { trackFindFilters } from "../components/Recommendation/behaviourTracker";
import type { FindFilterSnapshot } from "../components/Recommendation/behaviourTracker";
import { tmdbImage } from "@/lib/imageTmdb";
type Movie = {
  id?: number;
  title: string;
  media_type?: "movie" | "tv";
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  vote_average?: number;
  genres: string[];
  keywords: string[];
  votes: number;
};

const COLOR_SCHEME_MEDIA_QUERY = "(prefers-color-scheme: light)";
const calculateLuminance = (r: number, g: number, b: number) =>
  (0.299 * r + 0.587 * g + 0.114 * b) / 255;

const buildAmbientColor = (
  r: number,
  g: number,
  b: number,
  isLightMode: boolean,
) => {
  const lum = calculateLuminance(r, g, b);
  if (isLightMode) {
    const f = lum < 0.5 ? 1.5 : 1.2;
    const clamp = (v: number) => Math.min(Math.floor(v * f + 50), 235);
    return {
      solid: `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`,
      rgb: `${clamp(r)},${clamp(g)},${clamp(b)}`,
    };
  } else {
    const f = lum > 0.5 ? 0.2 : lum > 0.3 ? 0.3 : 0.45;
    const clamp = (v: number) => Math.max(Math.floor(v * f), 0);
    return {
      solid: `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`,
      rgb: `${clamp(r)},${clamp(g)},${clamp(b)}`,
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
  const [ambient, setAmbient] = useState<{ solid: string; rgb: string } | null>(
    null,
  );
  const imgRef = useRef<HTMLImageElement>(null);
  // FIX: Use a ref for the timeout so we can clear it on unmount/retry
  const extractingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      // FIX: Always reset the lock so future extractions aren't blocked
      extractingRef.current = false;
    }
  }, [isLightMode]);

  useEffect(() => {
    setAmbient(null);
    extractingRef.current = false;
  }, [imageUrl, isLightMode]);

  useEffect(() => {
    if (!imgRef.current) return;
    const img = imgRef.current;

    const handle = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(extract, 80);
    };

    if (img.complete && img.naturalWidth > 0) {
      handle();
    } else {
      img.addEventListener("load", handle);
      // FIX: Handle load errors — don't leave extractingRef stuck
      img.addEventListener("error", () => {
        extractingRef.current = false;
        setAmbient(null);
      });
    }

    return () => {
      img.removeEventListener("load", handle);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [extract, imageUrl]);

  return { imgRef, ambient };
};

function SceneResultCard({
  movie,
  totalVotes,
  isTopMatch,
}: {
  movie: Movie;
  totalVotes: number;
  isTopMatch: boolean;
}) {
  const isLightMode = useThemeDetection();
  const confidence = Math.round((movie.votes / totalVotes) * 100);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const badgeRef = useRef<HTMLSpanElement>(null);

  const imageUrl = movie.backdrop_path
    ? tmdbImage(movie.backdrop_path, "w1280")
    : movie.poster_path
      ? tmdbImage(movie.poster_path, "w780")
      : null;

  const { imgRef, ambient } = useCardAmbient(imageUrl, isLightMode);

  const fallbackRgb = isLightMode ? "238,240,242" : "3,25,38";
  const fallbackSolid = isLightMode ? "rgb(238,240,242)" : "rgb(3,25,38)";
  const solidColor = ambient?.solid ?? fallbackSolid;
  const rgbColor = ambient?.rgb ?? fallbackRgb;

  const fullTint = `rgba(${rgbColor}, 0.45)`;
  const layerBottom = `linear-gradient(to top, rgba(${rgbColor},1) 0%, rgba(${rgbColor},0.7) 12%, rgba(${rgbColor},0.3) 26%, rgba(${rgbColor},0) 42%)`;
  const layerTop = `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 18%)`;
  const layerCenter = `radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)`;

  return (
    <Link
      href={
        movie.id
          ? `/${movie.media_type ?? "movie"}/${createSlug(movie.title)}/${movie.id}`
          : "#"
      }
      className="block w-full rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-light-border dark:border-dark-border overflow-hidden"
      style={{
        backgroundColor: solidColor,
        transition: "background-color 700ms ease-in-out",
      }}
    >
      <div className="relative w-full aspect-4/3 sm:aspect-16/6 lg:aspect-16/5">
        <div className="group/img absolute inset-0 overflow-hidden">
          {imageUrl ? (
            <Image
              ref={imgRef}
              src={imageUrl}
              alt={movie.title}
              fill
              crossOrigin="anonymous"
              className="object-cover object-center transition-transform duration-500 group-hover/img:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1280px"
            />
          ) : (
            <div className="absolute inset-0 bg-dark-card" />
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
          <div
            className="absolute inset-0"
            style={{ background: layerCenter }}
          />
        </div>

        <div className="absolute inset-0 pointer-events-none">
          {/* Badges top-left */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1.5 pointer-events-auto">
            {isTopMatch && (
              <span className="bg-light-btn-bg dark:bg-dark-btn-bg backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
                Best Match
              </span>
            )}
            <span className="bg-black/50 backdrop-blur-md text-white text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full uppercase tracking-wide">
              {movie.media_type === "tv" ? "TV" : "Movie"}
            </span>
            <span
              ref={badgeRef}
              className="bg-black/50 backdrop-blur-md text-white text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full cursor-default"
              onMouseEnter={(e) => {
                e.stopPropagation();
                if (!badgeRef.current) return;
                const r = badgeRef.current.getBoundingClientRect();
                setTooltipPos({ x: r.left + r.width / 2, y: r.top });
              }}
              onMouseLeave={() => setTooltipPos(null)}
            >
              {confidence}%
            </span>
          </div>

          {/* Rating top-right */}
          {movie.vote_average && movie.vote_average > 0 && (
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 pointer-events-auto bg-light-btn-bg dark:bg-dark-btn-bg backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
              ★ {movie.vote_average.toFixed(1)}
            </div>
          )}

          {/* Title centered */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12 gap-1">
            <h3 className="text-white text-base sm:text-2xl lg:text-3xl font-bold text-center drop-shadow-lg line-clamp-2 leading-snug">
              {movie.title}
            </h3>
            <p className="text-white/50 text-[10px] sm:text-sm italic">
              Click for full details
            </p>
          </div>
        </div>
      </div>

      {/* Portal tooltip */}
      {tooltipPos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed z-9999"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y - 8,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="relative bg-dark-nav/90 backdrop-blur-sm text-dark-body-text text-[10px] leading-snug px-2.5 py-2 rounded-lg shadow-xl text-center w-44 whitespace-normal">
              How confident the AI is that this is the correct match, based on
              scene analysis.
              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-nav/90" />
            </div>
          </div>,
          document.body,
        )}

      {/* Info bar */}
      <div
        className="px-3 sm:px-4 py-2 sm:py-3 space-y-1 transition-all duration-700"
        style={{ backgroundColor: solidColor }}
      >
        {movie.genres.length > 0 && (
          <p className="text-light-body-text dark:text-dark-body-text text-xs sm:text-sm leading-snug">
            {movie.genres.slice(0, 4).join(", ")}
          </p>
        )}
        {movie.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {movie.keywords.slice(0, 5).map((kw) => (
              <span
                key={kw}
                className="text-light-secondary-text dark:text-dark-secondary-text font-mono text-[10px] sm:text-xs tracking-tight"
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
    <div className="w-full rounded-xl overflow-hidden bg-light-card dark:bg-dark-card animate-pulse">
      <div className="aspect-4/3 sm:aspect-16/6 lg:aspect-16/5" />
      <div className="px-3 sm:px-4 py-2 sm:py-3 space-y-2">
        <div className="h-3 bg-light-border dark:bg-dark-border rounded w-1/3" />
        <div className="h-2.5 bg-light-border dark:bg-dark-border rounded w-1/2" />
      </div>
    </div>
  );
}

// FIX: How long to wait before bailing to /find if no results (handles cold starts + mobile timeouts)
const LOAD_TIMEOUT_MS = 12_000;

export default function SceneDetectPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [ready, setReady] = useState(false);
  // FIX: Track timed-out state to show a helpful message instead of infinite skeleton
  const [timedOut, setTimedOut] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  const loadResults = useCallback(async () => {
    const raw = sessionStorage.getItem("sceneResults");
    if (!raw) {
      // Don't redirect immediately — wait for timeout handler
      return false;
    }
    try {
      const parsed = JSON.parse(raw);
      const seen = new Map();
      for (const m of parsed) {
        const key = m.id ?? m.title;
        if (!seen.has(key) || seen.get(key).votes < m.votes) seen.set(key, m);
      }
      const sorted = Array.from(seen.values()).sort(
        (a, b) => b.votes - a.votes,
      );
      setMovies(sorted);
      setReady(true);
      // Track scene detection result usage
      if (sorted.length > 0) {
        const topKeywords = sorted.slice(0, 3).flatMap((m) => m.keywords || []);
        await trackFindFilters({
          mediaType: "both",
          genres: [],
          excludeGenres: [],
          keywords: topKeywords.slice(0, 10),
          excludeKeywords: [],
          yearRange: [1950, new Date().getFullYear()],
          ratingRange: [0, 10],
          sortBy: "scene_votes",
          ts: Date.now(),
        } as FindFilterSnapshot);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    loadResults();

    // FIX: Give the backend time to respond before bailing — handles cold starts and slow mobile networks
    const timer = setTimeout(async () => {
      const retried = await loadResults();
      if (!retried) {
        setTimedOut(true);
      }
    }, LOAD_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [loadResults]);

  const handleTryAgain = () => {
    sessionStorage.removeItem("sceneResults");
    setMovies([]);
    setReady(false);
    setTimedOut(false);
    setModalOpen(true);
  };

  const totalVotes = movies.reduce((sum, m) => sum + m.votes, 0);

  // FIX: Show a clear error state instead of infinite skeleton on timeout
  if (timedOut) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col items-center justify-center px-6 gap-4 text-center">
        <p className="text-light-header dark:text-dark-header font-semibold text-base">
          No results found
        </p>
        <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm max-w-xs">
          The request may have timed out. Try capturing a clearer scene with
          good lighting.
        </p>
        <button
          onClick={handleTryAgain}
          className="mt-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-light-btn-bg dark:bg-dark-btn-bg text-white"
        >
          Try again
        </button>
        <SceneCameraModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            setTimedOut(false);
            loadResults();
            document.scrollingElement?.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <h1 className="sr-only">Scene Detection Results | WatchedThis</h1>
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-5">
        <div className="text-center flex items-center gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-lg lg:text-xl font-bold truncate text-light-header dark:text-dark-header">
              Scene Results
            </h1>
            {ready && (
              <p className="text-[11px] sm:text-xs text-light-secondary-text dark:text-dark-secondary-text mt-0.5">
                {movies.filter((m) => m.media_type !== "tv").length} Movies ·{" "}
                {movies.filter((m) => m.media_type === "tv").length} TV shows
                matched
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {!ready
            ? Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
            : movies.map((movie, i) => (
                <SceneResultCard
                  key={`${movie.media_type}-${movie.id ?? movie.title}-${i}`}
                  movie={movie}
                  totalVotes={totalVotes}
                  isTopMatch={i === 0}
                />
              ))}
        </div>

        {ready && (
          <button
            onClick={handleTryAgain}
            className="w-full py-2.5 sm:py-3 rounded-xl border border-light-border dark:border-dark-border text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-light-card dark:bg-dark-card text-light-body-text dark:text-dark-body-text hover:bg-light-border dark:hover:bg-dark-border"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
              />
            </svg>
            Try another scene
          </button>
        )}
      </div>

      <SceneCameraModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          loadResults();
          document.scrollingElement?.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
}
