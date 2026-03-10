"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ColorThief from "color-thief-browser";
import { createSlug } from "../components/utilities/createSlug";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

type Movie = {
  id?: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  overview?: string;
  vote_average?: number;
  genres: string[];
  keywords: string[];
  votes: number;
};

// ── Ambient helpers (identical to FindResultsPage) ────────────────────────────
const COLOR_SCHEME_MEDIA_QUERY = "(prefers-color-scheme: light)";

const calculateLuminance = (r: number, g: number, b: number) =>
  (0.299 * r + 0.587 * g + 0.114 * b) / 255;

const buildAmbientColor = (r: number, g: number, b: number, isLightMode: boolean) => {
  const lum = calculateLuminance(r, g, b);
  if (isLightMode) {
    const f = lum < 0.5 ? 1.5 : 1.2;
    const clamp = (v: number) => Math.min(Math.floor(v * f + 50), 235);
    return { solid: `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`, rgb: `${clamp(r)},${clamp(g)},${clamp(b)}` };
  } else {
    const f = lum > 0.5 ? 0.2 : lum > 0.3 ? 0.3 : 0.45;
    const clamp = (v: number) => Math.max(Math.floor(v * f), 0);
    return { solid: `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`, rgb: `${clamp(r)},${clamp(g)},${clamp(b)}` };
  }
};

const useThemeDetection = () => {
  const [isLightMode, setIsLightMode] = useState(false);
  const check = useCallback(() => {
    setIsLightMode(
      document.documentElement.classList.contains("light") ||
      window.matchMedia(COLOR_SCHEME_MEDIA_QUERY).matches
    );
  }, []);
  useEffect(() => {
    check();
    const mq = window.matchMedia(COLOR_SCHEME_MEDIA_QUERY);
    mq.addEventListener("change", check);
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => { mq.removeEventListener("change", check); obs.disconnect(); };
  }, [check]);
  return isLightMode;
};

const useCardAmbient = (imageUrl: string | null, isLightMode: boolean) => {
  const [ambient, setAmbient] = useState<{ solid: string; rgb: string } | null>(null);
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
    } catch { setAmbient(null); }
    finally { extractingRef.current = false; }
  }, [isLightMode]);

  useEffect(() => { setAmbient(null); }, [imageUrl, isLightMode]);

  useEffect(() => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const handle = () => setTimeout(extract, 80);
    if (img.complete) { handle(); } else { img.addEventListener("load", handle); }
    return () => img.removeEventListener("load", handle);
  }, [extract, imageUrl]);

  return { imgRef, ambient };
};
// ─────────────────────────────────────────────────────────────────────────────

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
  const confidence  = Math.round((movie.votes / totalVotes) * 100);

  // Prefer backdrop for the wide card image, fall back to poster
  const imageUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : movie.poster_path
    ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
    : null;

  const { imgRef, ambient } = useCardAmbient(imageUrl, isLightMode);

  const fallbackRgb   = isLightMode ? "210,210,210" : "15,15,15";
  const fallbackSolid = isLightMode ? "rgb(210,210,210)" : "rgb(15,15,15)";
  const solidColor    = ambient?.solid ?? fallbackSolid;
  const rgbColor      = ambient?.rgb   ?? fallbackRgb;

  const fullTint    = `rgba(${rgbColor}, 0.45)`;
  const layerBottom = `linear-gradient(to top, rgba(${rgbColor},1) 0%, rgba(${rgbColor},0.7) 12%, rgba(${rgbColor},0.3) 26%, rgba(${rgbColor},0) 42%)`;
  const layerTop    = `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 18%)`;
  const layerCenter = `radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)`;

  return (
    <Link
      href={movie.id ? `/movie/${createSlug(movie.title)}/${movie.id}` : "#"}
      className="block group w-full rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-light-border dark:border-dark-border overflow-hidden"
      style={{ backgroundColor: solidColor, transition: "background-color 700ms ease-in-out" }}
    >
      {/* Image */}
      <div className="relative w-full aspect-4/3 sm:aspect-16/6 lg:aspect-16/5 overflow-hidden">
        {imageUrl ? (
          <Image
            ref={imgRef}
            src={imageUrl}
            alt={movie.title}
            fill
            crossOrigin="anonymous"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1280px"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-gray-700 to-gray-900" />
        )}

        <div className="absolute inset-0 transition-all duration-700" style={{ backgroundColor: fullTint }} />
        <div className="absolute inset-0 transition-all duration-700" style={{ background: layerBottom }} />
        <div className="absolute inset-0" style={{ background: layerTop }} />
        <div className="absolute inset-0" style={{ background: layerCenter }} />

        {/* Badges — top left */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1.5">
          {isTopMatch && (
            <span className="bg-light-btn-bg dark:bg-dark-btn-bg backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
              Best Match
            </span>
          )}
          <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
            {confidence}%
          </span>
        </div>

        {/* Rating — top right (same position as FindResultsPage) */}
        {movie.vote_average && movie.vote_average > 0 && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-light-btn-bg dark:bg-dark-btn-bg backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
            ★ {movie.vote_average.toFixed(1)}
          </div>
        )}

        {/* Title centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12 gap-1">
          <h3 className="text-white text-base sm:text-2xl lg:text-3xl font-bold text-center drop-shadow-lg line-clamp-2 group-hover:text-light-border dark:group-hover:text-dark-secondary-text transition-colors leading-snug">
            {movie.title}
          </h3>
          <p className="text-white/50 text-[10px] sm:text-sm italic">Click for full details</p>
        </div>
      </div>

      {/* Info bar — genres + keywords, same as FindResultsPage */}
      <div
        className="px-3 sm:px-4 py-2 sm:py-3 space-y-1 transition-all duration-700"
        style={{ backgroundColor: solidColor }}
      >
        {/* Genres row */}
        {movie.genres.length > 0 && (
          <p className="text-light-body-text dark:text-white/80 text-xs sm:text-sm leading-snug">
            {movie.genres.slice(0, 4).join(", ")}
          </p>
        )}

        {/* Keywords row */}
        {movie.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {movie.keywords.slice(0, 5).map((kw) => (
              <span
                key={kw}
                className="text-light-secondary-text dark:text-white/50 font-mono text-[10px] sm:text-xs tracking-tight"
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

export default function SceneDetectPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [ready, setReady]   = useState(false);
  const router = useRouter();

  useEffect(() => {
    const raw = sessionStorage.getItem("sceneResults");
    if (!raw) { router.replace("/find"); return; }
    setMovies(JSON.parse(raw));
    setReady(true);
  }, []);

  const totalVotes = movies.reduce((sum, m) => sum + m.votes, 0);

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-5">

        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-light-btn-text dark:text-dark-btn-text hover:text-light-btn-hover-text dark:hover:text-dark-btn-hover-text transition-colors shrink-0 bg-transparent"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Back to Find</span>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-lg lg:text-xl font-bold truncate">
              Scene Results
            </h1>
            {ready && (
              <p className="text-[11px] sm:text-xs text-light-secondary-text dark:text-dark-secondary-text mt-0.5">
                {movies.length} movies matched your scene
              </p>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-3 sm:space-y-4">
          {!ready
            ? Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
            : movies.map((movie, i) => (
                <SceneResultCard
                  key={movie.id ?? i}
                  movie={movie}
                  totalVotes={totalVotes}
                  isTopMatch={i === 0}
                />
              ))
          }
        </div>

        {/* Try again */}
        {ready && (
          <button
            onClick={() => {
              sessionStorage.removeItem("sceneResults");
              router.replace("/find");
            }}
            className="w-full py-2.5 sm:py-3 rounded-xl borderborder-light-border dark:border-dark-border text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
            Try another scene
          </button>
        )}

      </div>
    </div>
  );
}