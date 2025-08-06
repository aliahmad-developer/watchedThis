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
}

export default function MediaPoster({ data }: MediaPosterProps) {
  const [hasError, setHasError] = useState(false);

  const displayTitle = data.title || data.name || "Untitled";
  const hasPoster = !!data.poster_path && !hasError;
  if (!!data.poster_path) {
    console.warn("Missing backdrop for:", data);
  }
  if(hasPoster){
    alert(hasPoster)
  }

  const getBadgeText = () => {
    if (data.media_type === "movie") return "MOVIE";
    if (data.media_type === "tv") return "SERIES";
    return "MEDIA";
  };

  return (
    <div className="relative aspect-[2/3] w-full max-w-xs rounded-2xl overflow-hidden shadow-lg group transition-all duration-300 hover:shadow-xl bg-gray-900">
      {/* Fallback background and title if image is missing or broken */}
      {!hasPoster && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center px-2 text-center border-1 border-white rounded-2xl">
          <span className="text-gray-500 text-lg">{displayTitle}</span>
        </div>
      )}

      {/* Image with object-contain to fit full image in container */}
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

      {/* Badge */}
      <div className="border-1 border-grey absolute top-3 left-3 bg-transparent text-white px-3 py-1 rounded-md text-xs font-bold tracking-wide shadow-md backdrop-blur-sm z-10">
        {getBadgeText()}
      </div>
    </div>
  );
}
