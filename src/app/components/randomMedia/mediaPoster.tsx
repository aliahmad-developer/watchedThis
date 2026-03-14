"use client";
import Image from "next/image";
import { memo, useState } from "react";

interface MediaPosterProps {
  data: {
    poster_path?: string;
    title?: string;
    name?: string;
    media_type?: string;
  };
  textScheme?: "light" | "dark";
  priority?: boolean; // let the parent decide — only true for above-the-fold posters
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
    <line x1="17" y1="2" x2="17" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="2" y1="7" x2="7" y2="7" />
    <line x1="2" y1="17" x2="7" y2="17" />
    <line x1="17" y1="17" x2="22" y2="17" />
    <line x1="17" y1="7" x2="22" y2="7" />
  </svg>
);

const BADGE_MAP: Record<string, string> = {
  movie: "MOVIE",
  tv: "SERIES",
};

function MediaPoster({ data, textScheme = "light", priority = false }: MediaPosterProps) {
  const [hasError, setHasError] = useState(false);

  const displayTitle = data.title || data.name || "Untitled";
  const hasPoster = !!data.poster_path && !hasError;
  const badgeText = BADGE_MAP[data.media_type ?? ""] ?? "MEDIA";

  const badgeTextColor = textScheme === "light" ? "text-white" : "text-gray-900";
  const badgeBorderColor = textScheme === "light" ? "border-white/40" : "border-gray-900/40";

  return (
    <div className="relative aspect-2/3 w-full max-w-xs rounded-2xl overflow-hidden shadow-lg group transition-all duration-300 hover:shadow-xl bg-light-border dark:bg-dark-border">
      {hasPoster ? (
        <Image
          draggable={false}
          // w342 is the right TMDB size for ~200px wide cards — don't use w500/original
          src={`https://image.tmdb.org/t/p/w342${data.poster_path}`}
          alt={`Poster for ${displayTitle}`}
          fill
          onContextMenu={(e) => e.preventDefault()}
          className="object-contain object-center transition-opacity duration-300 select-none"
          // Accurate sizes: poster cards are small, max ~320px wide
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 200px"
          priority={priority}
          onError={() => setHasError(true)}
        />
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
        className={`border absolute top-3 left-3 bg-transparent px-3 py-1 rounded-md text-xs font-bold tracking-wide shadow-md backdrop-blur-sm z-10 ${badgeTextColor} ${badgeBorderColor} ${!hasPoster ? "border-light-disabled/40 dark:border-dark-disabled/40 text-light-disabled dark:text-dark-disabled" : ""}`}
      >
        {badgeText}
      </div>
    </div>
  );
}

export default memo(MediaPoster);