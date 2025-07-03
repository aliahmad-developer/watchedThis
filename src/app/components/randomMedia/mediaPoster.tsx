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
  const hasPoster = !!data.poster_path;

  const getBadgeText = () => {
    if (data.media_type === "movie") return "Movie";
    if (data.media_type === "tv") return "TV Series";
    return "Media";
  };

  return (
    <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-lg group transition-all duration-300 hover:shadow-xl">
      {/* Background fallback text */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <span className="text-gray-500 text-lg text-center px-2">{displayTitle}</span>
      </div>

      {/* Render image only if available and not broken */}
      {hasPoster && !hasError && (
        <Image
          src={`https://image.tmdb.org/t/p/w500${data.poster_path}`}
          alt={`Poster for ${displayTitle}`}
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
          onError={() => setHasError(true)}
        />
      )}

      {/* Badge */}
      <div className="absolute top-3 left-3 bg-light-btn-bg/90 dark:bg-dark-btn-bg/90 text-white px-3 py-1 rounded-md text-xs font-bold tracking-wide shadow-md backdrop-blur-sm">
        {getBadgeText()}
      </div>
    </div>
  );
}
