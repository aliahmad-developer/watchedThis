"use client";
import Image from "next/image";
import { useState } from "react";

interface MediaPosterProps {
  data: {
    poster_path?: string;
    title?: string;
    name?: string;
    media_type?: string;
  };
  textScheme?: "light" | "dark";
}

export default function MediaPoster({ data, textScheme = "light" }: MediaPosterProps) {
  const [hasError, setHasError] = useState(false);

  const displayTitle = data.title || data.name || "Untitled";
  const hasPoster = !!data.poster_path && !hasError;

  const getBadgeText = () => {
    if (data.media_type === "movie") return "MOVIE";
    if (data.media_type === "tv") return "SERIES";
    return "MEDIA";
  };

  // Badge and fallback title adapt to the backdrop's luminance
  const badgeTextColor = textScheme === "light" ? "text-white" : "text-gray-900";
  const badgeBorderColor = textScheme === "light" ? "border-white/40" : "border-gray-900/40";
  const fallbackTitleColor = textScheme === "light" ? "text-gray-300" : "text-gray-600";

  return (
    <div className="relative aspect-2/3 w-full max-w-xs rounded-2xl overflow-hidden shadow-lg group transition-all duration-300 hover:shadow-xl bg-gray-900">
      {!hasPoster && (
        <div className="absolute inset-0 bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center px-2 text-center rounded-2xl">
          <span className={`text-lg ${fallbackTitleColor}`}>{displayTitle}</span>
        </div>
      )}

      {hasPoster && (
        <Image
          draggable={false}
          src={`https://image.tmdb.org/t/p/w500${data.poster_path}`}
          alt={`Poster for ${displayTitle}`}
          fill
          onContextMenu={(e) => e.preventDefault()}
          className="object-contain object-center transition-opacity duration-300 select-none"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
          onError={() => setHasError(true)}
        />
      )}

      <div className={`border absolute top-3 left-3 bg-transparent px-3 py-1 rounded-md text-xs font-bold tracking-wide shadow-md backdrop-blur-sm z-10 ${badgeTextColor} ${badgeBorderColor}`}>
        {getBadgeText()}
      </div>
    </div>
  );
}