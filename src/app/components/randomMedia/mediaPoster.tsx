"use client";
import Image from "next/image";
import { memo, useState } from "react";
import type { AmbientTextColors } from "./detailsPage";
import { tmdbImage } from "@/lib/imageTmdb";

interface MediaPosterProps {
  data: {
    poster_path?: string;
    title?: string;
    name?: string;
    media_type?: string;
  };
  textScheme?: "light" | "dark";
  ambientText?: AmbientTextColors;
  priority?: boolean;
  /** Pass "absolute inset-0 overflow-hidden" when used inside a card so it fills the container */
  containerClassName?: string;
}

const FilmIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-10 h-10 opacity-30"
  >
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <line x1="7" y1="2" x2="7" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="2" y1="7" x2="7" y2="7" />
    <line x1="2" y1="17" x2="7" y2="17" />
    <line x1="17" y1="2" x2="17" y2="22" />
    <line x1="17" y1="17" x2="22" y2="17" />
    <line x1="17" y1="7" x2="22" y2="7" />
  </svg>
);

const BADGE_MAP: Record<string, string> = {
  movie: "MOVIE",
  tv: "SERIES",
};

const FALLBACK_AMBIENT: AmbientTextColors = {
  primary: "rgba(255,255,255,0.95)",
  secondary: "rgba(255,255,255,0.70)",
  muted: "rgba(255,255,255,0.40)",
};

const BLUR_DATA_URL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function MediaPoster({
  data,
  textScheme = "light",
  ambientText = FALLBACK_AMBIENT,
  priority = false,
  containerClassName,
}: MediaPosterProps) {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const displayTitle = data.title || data.name || "Untitled";
  const hasPoster = !!data.poster_path && !hasError;
  const badgeText = BADGE_MAP[data.media_type ?? ""] ?? "MEDIA";

  const posterSrc = tmdbImage(data.poster_path ?? null, "w342")!;

  const defaultContainerClass =
    "relative aspect-2/3 mx-auto rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl bg-light-border dark:bg-dark-border w-32 sm:w-48 md:w-56 lg:w-full lg:max-w-60 xl:max-w-xs";

  return (
    <div className={containerClassName ?? defaultContainerClass}>
      {hasPoster ? (
        <>
          {!loaded && (
            <div className="absolute inset-0 animate-pulse bg-linear-to-br from-white/5 via-white/10 to-white/5" />
          )}
          <Image
            draggable={false}
            src={posterSrc}
            alt={`Poster for ${displayTitle}`}
            fill
            onContextMenu={(e) => e.preventDefault()}
            className={`object-cover object-center select-none transition-opacity duration-300 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            priority={priority}
            fetchPriority={priority ? "high" : "auto"}
            sizes="(max-width: 640px) 128px, (max-width: 768px) 192px, (max-width: 1024px) 224px, 260px"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            onLoad={() => setLoaded(true)}
            onError={() => setHasError(true)}
          />
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
          <FilmIcon />
          <span className="text-xs font-medium leading-snug line-clamp-3 text-light-secondary-text dark:text-dark-secondary-text">
            {displayTitle}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-light-disabled dark:text-dark-disabled">
            {badgeText}
          </span>
        </div>
      )}

      <div
        className="absolute top-3 left-3 bg-transparent px-3 py-1 rounded-md text-xs font-bold tracking-wide shadow-md backdrop-blur-sm z-10 border transition-colors duration-700"
        style={
          hasPoster
            ? { color: ambientText.primary, borderColor: ambientText.secondary }
            : undefined
        }
      >
        {badgeText}
      </div>
    </div>
  );
}

export default memo(MediaPoster);
