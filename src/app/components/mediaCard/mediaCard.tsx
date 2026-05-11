"use client";

import { useState } from "react";
import Link from "next/link";
import MediaPoster from "../randomMedia/mediaPoster";
import TrailerModal from "../playTrailerModal/trailerModal"; // ← adjust path
import { trackClick } from "../Recommendation/behaviourTracker";
import { createSlug } from "../utilities/createSlug";
import { useUserList } from "../../components/hooks/useUserList"; // ← adjust path
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPlus,
  faLock,
  faHeart,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";

interface MediaCardProps {
  item: {
    id: number;
    title?: string;
    name?: string;
    poster_path?: string;
    media_type?: string;
    runtime?: number;
    episode_run_time?: number[];
    vote_average?: number;
    overview?: string;
    number_of_seasons?: number;
    number_of_episodes?: number;
    vote_count?: number;
    release_date?: string;
    first_air_date?: string;
  };
  displayTitle?: string;
  hideMetaData?: boolean;
  index?: number;
}

export default function MediaCard({
  item,
  displayTitle,
  hideMetaData,
  index = 0,
}: MediaCardProps) {
  const title = item.title || item.name || "Untitled";
  const mediaType = item.media_type || "movie";
  const duration =
    item.runtime || item.episode_run_time?.find((v) => v > 0) || null;

  const slug = createSlug(title);
  const href = `/${mediaType}/${slug}/${item.id}`;

  const year = (item.release_date || item.first_air_date)?.slice(0, 4);

  // ── Trailer state ──────────────────────────────────────────
  const [showTrailer, setShowTrailer] = useState(false);

  // ── Favourites ─────────────────────────────────────────────
  const { currentStatus, saveToList, loading, isAuthenticated } = useUserList({
    mediaId: item.id,
    mediaType: mediaType as "movie" | "tv",
    title,
    poster_path: item.poster_path,
  });

  const isFavourited = currentStatus === "favourite";

  const handleFavourite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return; // guarded by lock UI anyway
    try {
      await saveToList("favourite");
      toast[isFavourited ? "success" : "success"](
        isFavourited ? "Removed from Favourites" : "Added to Favourites",
        { icon: isFavourited ? "🗑️" : "❤️" },
      );
    } catch {
      toast.error("Something went wrong, please try again");
    }
  };

  const handleClick = () => trackClick(item.id, mediaType as "movie" | "tv");
  const delay = `${Math.min(index * 40, 300)}ms`;
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

  const hasOverview = Boolean(item.overview?.trim());
  const hasRating = Boolean(item.vote_average);
  const hasMeta =
    mediaType === "tv"
      ? Boolean(item.number_of_seasons || item.number_of_episodes)
      : Boolean(duration);
  const hasHoverContent = hasOverview || hasRating || hasMeta;

  return (
    <>
      {/* ── Trailer Modal ───────────────────────────────────── */}
      {showTrailer && (
        <TrailerModal
          mediaId={item.id}
          mediaType={mediaType as "movie" | "tv"}
          title={title}
          year={year}
          onClose={() => setShowTrailer(false)}
        />
      )}

      <Link
        prefetch={false}
        href={href}
        draggable
        onClick={handleClick}
        className="group block cursor-pointer rounded-2xl opacity-0 animate-[fadeUp_0.45s_ease_forwards] text-left"
        style={{ animationDelay: delay }}
      >
        {/* CARD */}
        <div className="relative aspect-2/3 overflow-hidden rounded-2xl bg-black group">
          {/* IMAGE */}
          <div className="absolute inset-0 transition-transform duration-100 ease-out group-hover:scale-[1.04]">
            <MediaPoster data={item} />
          </div>

          {hasHoverContent && (
            <>
              {/* OVERLAY */}
              <div className="absolute inset-0 z-10 bg-white/75 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out backdrop-blur-[2px]" />

              {/* CONTENT */}
              <div className="absolute inset-0 z-20 flex flex-col justify-between p-5 text-left items-start opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out">
                {/* TOP */}
                <div className="w-full">
                  <h3 className="text-gray-900 dark:text-white text-[1.1rem] font-bold leading-tight line-clamp-2">
                    {title}
                  </h3>

                  {hasRating && (
                    <div className="mt-4 flex items-center justify-start gap-1.5">
                      <FontAwesomeIcon
                        icon={faStar}
                        className="w-4 h-4 text-light-secondary-text dark:text-white"
                      />
                      <span className="text-gray-900 dark:text-white text-sm font-semibold">
                        {rating}
                      </span>
                      {item.vote_count && (
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          ({(item.vote_count / 1000).toFixed(1)}K)
                        </span>
                      )}
                    </div>
                  )}

                  {hasMeta && (
                    <div className="mt-4 flex flex-col items-start gap-1 text-left">
                      {mediaType === "tv" && item.number_of_seasons ? (
                        <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">
                          {item.number_of_seasons}{" "}
                          {item.number_of_seasons === 1 ? "Season" : "Seasons"}
                        </span>
                      ) : null}
                      {mediaType === "tv" && item.number_of_episodes ? (
                        <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">
                          {item.number_of_episodes} Episodes
                        </span>
                      ) : null}
                      {duration ? (
                        <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">
                          {duration} min
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* BOTTOM */}
                <div className="w-full">
                  {hasOverview && (
                    <p className="text-left text-gray-800 dark:text-gray-200 text-sm leading-relaxed line-clamp-5">
                      {item.overview}
                    </p>
                  )}

                  {/* ACTIONS */}
                  <div className="mt-5 flex items-center gap-5">
                    {/* ── 1. PLAY TRAILER ───────────────────── */}
                    <div className="relative group/play">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setShowTrailer(true);
                        }}
                        className="bg-transparent text-light-accent dark:text-white hover:scale-110 transition-all duration-200"
                      >
                        <FontAwesomeIcon icon={faPlay} className="w-5 h-5" />
                      </button>
                      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[10px] text-white opacity-0 group-hover/play:opacity-100 transition-opacity duration-200">
                        Play Trailer
                      </span>
                    </div>

                    {/* ── 2. FAVOURITE ──────────────────────── */}
                    <div className="relative group/fav">
                      <button
                        onClick={
                          isAuthenticated
                            ? handleFavourite
                            : (e) => e.preventDefault()
                        }
                        disabled={loading}
                        className={`bg-transparent transition-all duration-200 hover:scale-110 disabled:opacity-50
                          ${
                            isFavourited
                              ? "text-red-500 dark:text-red-400"
                              : "text-light-accent dark:text-white"
                          }`}
                      >
                        <FontAwesomeIcon
                          icon={isAuthenticated ? faHeart : faLock}
                          className="w-5 h-5"
                        />
                      </button>
                      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[10px] text-white opacity-0 group-hover/fav:opacity-100 transition-opacity duration-200">
                        {isAuthenticated
                          ? isFavourited
                            ? "Remove Favourite"
                            : "Add to Favourites"
                          : "Login to unlock library"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* BORDER */}
          <div className="absolute inset-0 z-30 rounded-2xl ring-1 ring-black/5 dark:ring-white/0 group-hover:ring-black/10 dark:group-hover:ring-white/15 transition-all duration-500 pointer-events-none" />
        </div>

        {/* TITLE BELOW — fades out on hover */}
        <div className="mt-3 px-1">
          <div className="text-sm font-semibold text-center line-clamp-2 transition-all duration-500 group-hover:opacity-0 group-hover:text-light-accent dark:group-hover:text-dark-accent">
            {title}
          </div>

          {displayTitle && (
            <div className="mt-1 text-xs text-center text-gray-500 dark:text-gray-400 line-clamp-1 transition-all duration-500 group-hover:opacity-0">
              {displayTitle}
            </div>
          )}

          {!hideMetaData && (
            <div className="mt-1 text-xs text-center text-light-accent dark:text-dark-accent flex justify-center gap-2 transition-all duration-500 group-hover:opacity-0">
              <span className="capitalize">{mediaType}</span>
              {duration ? <span>{duration}m</span> : null}
            </div>
          )}
        </div>
      </Link>
    </>
  );
}
