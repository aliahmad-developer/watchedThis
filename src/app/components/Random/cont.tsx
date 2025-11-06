"use client";
import { useEffect, useState, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
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

export default function TwoSectionLayout() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unified fetch logic with cancellation support
  const fetchRandomMedia = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const requests = Array.from({ length: 3 }, () =>
        fetch("/api/randomCall", { signal: controller.signal }).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
      );

      const responses = await Promise.allSettled(requests);
      const results = responses
        .filter((r): r is PromiseFulfilledResult<MediaItem> => r.status === "fulfilled" && !r.value.error)
        .map((r) => r.value);

      if (!results.length) throw new Error("All requests failed");
      setMedia(results);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Error fetching media:", err);
      setError("Failed to load media. Please try again.");
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, []);

  useEffect(() => {
    fetchRandomMedia();
  }, [fetchRandomMedia]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-light-accent dark:border-dark-accent border-t-transparent" />
          <p className="text-light-secondary-text dark:text-dark-secondary-text">
            Loading recommended media...
          </p>
        </div>
      </div>
    );
  }

  if (error || media.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 bg-light-bg dark:bg-dark-bg text-center">
        <p className="text-red-500 font-semibold">
          {error || "Could not load media"}
        </p>
        <button
          onClick={fetchRandomMedia}
          className="rounded-lg bg-light-btn-bg dark:bg-dark-btn-bg text-light-btn-text dark:text-dark-btn-text px-6 py-2 transition hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 bg-light-bg dark:bg-dark-bg">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-light-header dark:text-dark-header">
          Recommended for You
        </h1>
      </header>

      {/* Responsive Layout */}
      <div className="space-y-4 lg:space-y-0">
        {/* Mobile (sm): Only right container visible */}
        <div className="block sm:hidden">
          <div className="grid grid-cols-1 gap-3">
            {media.slice(0, 2).map((item) => (
              <MobileCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Medium (md): 50-50 horizontal layout */}
        <div className="hidden sm:block lg:hidden">
          <div className="grid grid-cols-2 gap-3 min-h-[180px]">
            <FeaturedCard item={media[0]} />
            <RightStackCard item={media[1]} />
          </div>
        </div>

        {/* Large (lg+): Original 2/3 + 1/3 layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-4 min-h-[220px]">
          <div className="col-span-2">
            <FeaturedCard item={media[0]} />
          </div>
          <div className="col-span-1 grid grid-rows-2 gap-3">
            {media.slice(1).map((item) => (
              <RightStackCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface CardProps {
  item: MediaItem;
}

/** ✅ Memoized Featured Card */
const FeaturedCard = memo(({ item }: CardProps) => {
  const imageUrl = getImageUrl(item.backdrop_path || item.poster_path, 1280);

  return (
    <div className="relative w-full h-full min-h-[160px] md:min-h-[180px] rounded-xl overflow-hidden group bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border">
      <ImageWrapper src={imageUrl} alt={item.title || "Media"} />

      <div className="absolute bottom-0 left-0 p-3 lg:p-4 text-white z-10 max-w-[90%] lg:max-w-[80%]">
        <p className="text-xs opacity-80 mb-1 hidden sm:block">Today</p>
        <h2 className="text-base md:text-lg lg:text-xl font-semibold leading-tight line-clamp-2">
          {item.title}
        </h2>
        <p className="text-xs md:text-sm opacity-90 lg:line-clamp-2 hidden md:block">
          {item.overview}
        </p>
        <Link
          href={`/${item.media_type}/${createSlug(item.title || "")}/${item.id}`}
          className="inline-block mt-2 lg:mt-3"
        >
          <button className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5 text-xs md:text-sm font-medium transition bg-light-btn-bg dark:bg-dark-btn-bg text-light-btn-text dark:text-dark-btn-text hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg">
            View details
          </button>
        </Link>
      </div>
    </div>
  );
});
FeaturedCard.displayName = "FeaturedCard";

const RightStackCard = memo(({ item }: CardProps) => {
  const imageUrl = getImageUrl(item.backdrop_path || item.poster_path, 780);
  const daysAgo = getDaysAgo(item.release_date);

  return (
    <Link
      href={`/${item.media_type}/${createSlug(item.title || "")}/${item.id}`}
      className="relative w-full h-full min-h-[140px] md:min-h-[160px] rounded-xl overflow-hidden group bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border"
    >
      <ImageWrapper src={imageUrl} alt={item.title || "Media"} />

      <div className="absolute bottom-0 left-0 p-2 md:p-3 text-white z-10 max-w-[90%]">
        <p className="text-xs opacity-80 hidden sm:block">{daysAgo}</p>
        <h3 className="text-sm md:text-base font-semibold leading-snug line-clamp-2">
          {item.title}
        </h3>
        <p className="text-xs opacity-90 line-clamp-2 hidden md:block">
          {item.overview}
        </p>
      </div>
    </Link>
  );
});
RightStackCard.displayName = "RightStackCard";

/** Mobile Card for small screens */
const MobileCard = memo(({ item }: CardProps) => {
  const imageUrl = getImageUrl(item.backdrop_path || item.poster_path, 780);
  const daysAgo = getDaysAgo(item.release_date);

  return (
    <Link
      href={`/${item.media_type}/${createSlug(item.title || "")}/${item.id}`}
      className="relative aspect-2/3 min-h-[120px] rounded-xl overflow-hidden group bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border"
    >
      <ImageWrapper src={imageUrl} alt={item.title || "Media"} />

      <div className="absolute bottom-0 left-0 p-3 text-white z-10 max-w-[85%]">
        <p className="text-xs opacity-80">{daysAgo}</p>
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">
          {item.title}
        </h3>
      </div>
    </Link>
  );
});
MobileCard.displayName = "MobileCard";

const ImageWrapper = memo(({ src, alt }: { src: string; alt: string }) => (
  <div className="relative w-full h-full">
    <Image
      src={src}
      alt={alt}
      fill
      priority={false}
      className="object-cover transition-transform duration-700 group-hover:scale-105"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
  </div>
));
ImageWrapper.displayName = "ImageWrapper";

/** 🧩 Utility functions */
const getImageUrl = (path?: string | null, width = 1280): string =>
  path ? `https://image.tmdb.org/t/p/w${width}${path}` : "https://via.placeholder.com/800x450?text=No+Image";

const getDaysAgo = (releaseDate?: string) => {
  if (!releaseDate) return "Unknown";
  const diff = Math.floor((Date.now() - new Date(releaseDate).getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
};