"use client";

import { useState } from "react";
import Link from "next/link";
import MediaPoster from "../randomMedia/mediaPoster";
import TrailerModal from "../playTrailerModal/trailerModal";
import { trackClick } from "../Recommendation/behaviourTracker";
import { createSlug } from "../utilities/createSlug";
import { useUserList } from "../../components/hooks/useUserList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
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

  const [showTrailer, setShowTrailer] = useState(false);

  const { currentStatus, saveToList, loading, isAuthenticated } = useUserList({
    mediaId: item.id,
    mediaType: mediaType as "movie" | "tv",
    title,
    poster_path: item.poster_path,
  });

  const isFavourited = currentStatus === "favourite";

  const handleFavourite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) return;

    try {
      await saveToList("favourite");

      toast.success(
        isFavourited ? "Removed from Favourites" : "Added to Favourites",
        {
          icon: isFavourited ? "🗑️" : "❤️",
        },
      );
    } catch {
      toast.error("Something went wrong, please try again");
    }
  };

  const handleClick = () => {
    trackClick(item.id, mediaType as "movie" | "tv");
  };

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
        draggable={false}
        onClick={handleClick}
        className="
          group block cursor-pointer rounded-2xl text-left
          opacity-0 animate-[fadeUp_0.45s_ease_forwards]
          transition-transform duration-300
          [@media(hover:hover)]:hover:-translate-y-1
        "
        style={{ animationDelay: delay }}
      >
        {/* CARD */}
        <div className="relative aspect-2/3 overflow-hidden rounded-2xl bg-black">
          {/* IMAGE */}
          <div className="absolute inset-0 transition-transform duration-300 ease-out [@media(hover:hover)]:group-hover:scale-[1.04]">
            <MediaPoster
              data={item}
              containerClassName="absolute inset-0 overflow-hidden"
            />
          </div>

          {hasHoverContent && (
            <>
              {/* OVERLAY */}
              <div
                className="
                  absolute inset-0 z-10
                  bg-gradient-to-t
                  from-white/90 via-white/75 to-white/60
                  dark:from-black/90 dark:via-black/85 dark:to-black/40
                  backdrop-blur-[2px]
                  transition-all duration-300

                  opacity-0 pointer-events-none

                  [@media(hover:hover)]:group-hover:opacity-100
                  [@media(hover:hover)]:group-hover:pointer-events-auto
                "
              />

              {/* CONTENT */}
              <div
                className="
                  absolute inset-0 z-20
                  flex flex-col justify-between min-h-0
                  p-5 text-left items-start
                  transition-all duration-300

                  opacity-0 pointer-events-none

                  [@media(hover:hover)]:group-hover:opacity-100
                  [@media(hover:hover)]:group-hover:pointer-events-auto
                "
              >
                {/* TOP */}
                <div className="w-full shrink min-h-0 overflow-hidden">
                  <h3 className="text-gray-900 dark:text-white text-[1.05rem] font-bold leading-tight line-clamp-1">
                    {title}
                  </h3>

                  {hasRating && (
                    <div className="mt-2 flex items-center gap-1.5">
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
                    <div className="mt-2 flex flex-col items-start gap-1 text-left">
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
                {/* BOTTOM */}
                <div className="w-full flex flex-col justify-end flex-1 min-h-0">
                  {hasOverview && (
                   <p
  className={`
  hidden md:block
  text-left
  text-gray-800 dark:text-gray-200
  text-sm leading-relaxed
  overflow-hidden
  break-words
  mb-auto
  ${mediaType === "tv" ? "line-clamp-3 lg:line-clamp-4" : "line-clamp-4 lg:line-clamp-5"}
`}
>
                      {item.overview}
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-4 z-10">
                    {/* PLAY */}
                    <div className="relative group/play">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          setShowTrailer(true);
                        }}
                        className="
                          bg-transparent
                          text-light-accent dark:text-white
                          hover:scale-110
                          transition-all duration-200
                        "
                      >
                        <FontAwesomeIcon icon={faPlay} className="w-5 h-5" />
                      </button>

                      <span
                        className="
                          pointer-events-none
                          absolute -top-8 left-1/2
                          -translate-x-1/2
                          whitespace-nowrap
                          rounded-md
                          bg-black/80
                          px-2 py-1
                          text-[10px]
                          text-white
                          opacity-0
                          transition-opacity duration-200
                          group-hover/play:opacity-100
                          hidden md:block
                        "
                      >
                        Play Trailer
                      </span>
                    </div>

                    {/* FAV */}
                    <div className="relative group/fav">
                      <button
                        onClick={
                          isAuthenticated
                            ? handleFavourite
                            : (e) => e.preventDefault()
                        }
                        disabled={loading}
                        className={`
                          bg-transparent
                          transition-all duration-200
                          hover:scale-110
                          disabled:opacity-50
                          ${
                            isFavourited
                              ? "text-red-500 dark:text-red-400"
                              : "text-light-accent dark:text-white"
                          }
                        `}
                      >
                        <FontAwesomeIcon
                          icon={isAuthenticated ? faHeart : faLock}
                          className="w-5 h-5"
                        />
                      </button>

                      <span
                        className="
                          pointer-events-none
                          absolute -top-8 left-1/2
                          -translate-x-1/2
                          whitespace-nowrap
                          rounded-md
                          bg-black/80
                          px-2 py-1
                          text-[10px]
                          text-white
                          opacity-0
                          transition-opacity duration-200
                          group-hover/fav:opacity-100
                          hidden md:block
                        "
                      >
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
          <div className="absolute inset-0 z-30 rounded-2xl ring-1 ring-black/5 dark:ring-white/5 transition-all duration-300 pointer-events-none" />
        </div>

        {/* LOWER INFO */}
        <div
          className="
            mt-3 px-1
            transition-all duration-300

            [@media(hover:hover)]:group-hover:opacity-0
            [@media(hover:hover)]:group-hover:translate-y-2
            [@media(hover:hover)]:group-hover:pointer-events-none
          "
        >
          <div className="text-sm font-semibold text-center line-clamp-2 text-light-header dark:text-dark-header">
            {title}
          </div>

          {displayTitle && (
            <div className="mt-1 text-xs text-center text-gray-500 dark:text-gray-400 line-clamp-1">
              {displayTitle}
            </div>
          )}

          {!hideMetaData && (
            <div className="mt-1 text-xs text-center text-light-accent dark:text-dark-accent flex justify-center gap-2">
              <span className="capitalize">{mediaType}</span>
            </div>
          )}
        </div>
      </Link>
    </>
  );
}
