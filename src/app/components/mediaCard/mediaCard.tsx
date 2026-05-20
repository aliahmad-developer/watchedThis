"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faLock,
  faStar,
  faHeart,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { icon } from "@fortawesome/fontawesome-svg-core";
import toast from "react-hot-toast";

import MediaPoster from "../randomMedia/mediaPoster";
import TrailerModal from "../playTrailerModal/trailerModal";

import { trackClick } from "../Recommendation/behaviourTracker";
import { createSlug } from "../utilities/createSlug";

import { useUserList } from "../../components/hooks/useUserList";

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
    genre_ids?: number[];
  };

  displayTitle?: string;
  index?: number;
}

function MediaCard({ item, displayTitle, index = 0 }: MediaCardProps) {
  const title = useMemo(
    () => item.title || item.name || "Untitled",
    [item.title, item.name],
  );

  const mediaType = useMemo(
    () => item.media_type || "movie",
    [item.media_type],
  );

  const duration = useMemo(() => {
    return item.runtime || item.episode_run_time?.find((v) => v > 0) || null;
  }, [item.runtime, item.episode_run_time]);

  const slug = useMemo(() => {
    return createSlug(title);
  }, [title]);

  const href = useMemo(() => {
    return `/${mediaType}/${slug}/${item.id}`;
  }, [mediaType, slug, item.id]);

  const year = useMemo(() => {
    return (item.release_date || item.first_air_date)?.slice(0, 4);
  }, [item.release_date, item.first_air_date]);

  const rating = useMemo(() => {
    return item.vote_average ? item.vote_average.toFixed(1) : null;
  }, [item.vote_average]);

  const delay = useMemo(() => {
    return `${Math.min(index * 40, 300)}ms`;
  }, [index]);

  const [showTrailer, setShowTrailer] = useState(false);

  const particleContainerRef = useRef<HTMLDivElement>(null);

  const { currentStatus, saveToList, loading, isAuthenticated } = useUserList({
    mediaId: item.id,
    mediaType: mediaType as "movie" | "tv",
    title,
    poster_path: item.poster_path,
    genre_ids: item.genre_ids,
  });

  const isFavourited = currentStatus === "favourite";

  const hasOverview = Boolean(item.overview?.trim());

  const hasRating = Boolean(item.vote_average);

  const hasMeta = useMemo(() => {
    return mediaType === "tv"
      ? Boolean(item.number_of_seasons || item.number_of_episodes)
      : Boolean(duration);
  }, [mediaType, item.number_of_seasons, item.number_of_episodes, duration]);

  const hasHoverContent = hasOverview || hasRating || hasMeta;

  const spawnParticles = useCallback(
    (type: "play" | "heart" | "trash", count = 2) => {
      const container = particleContainerRef.current;
      if (!container) return;

      const iconMap = {
        play: faPlay,
        heart: faHeart,
        trash: faTrashCan,
      };

      for (let i = 0; i < count; i++) {
        window.setTimeout(() => {
          const el = document.createElement("span");
          el.style.cssText = `
        position: absolute;
        pointer-events: none;
        z-index: 50;
        font-size: ${16 + Math.random() * 8}px;
        left: ${38 + (Math.random() - 0.5) * 28}%;
        bottom: 48px;
        opacity: 1;
        transform: translateY(0) scale(1);
        animation: mcFloatUp 0.8s ease-out forwards;
        user-select: none;
        will-change: transform, opacity;
      `;

          el.innerHTML = icon(iconMap[type], {}).html[0];

          container.appendChild(el);
          el.addEventListener("animationend", () => el.remove());
        }, i * 130);
      }
    },
    [],
  );

  /*
  |--------------------------------------------------------------------------
  | HANDLERS
  |--------------------------------------------------------------------------
  */

  const handleClick = useCallback(() => {
    trackClick(item.id, mediaType as "movie" | "tv");
  }, [item.id, mediaType]);

  const handleTrailerOpen = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      spawnParticles("play", 2);

      setShowTrailer(true);
    },
    [spawnParticles],
  );

  const handleFavourite = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isAuthenticated) return;

      try {
        await saveToList("favourite");

        if (!isFavourited) {
          spawnParticles("heart", 3);
        }

        toast.success(
          isFavourited ? "Removed from Favourites" : "Added to Favourites",
          {
            icon: isFavourited ? (
              <FontAwesomeIcon icon={faTrashCan} />
            ) : (
              <FontAwesomeIcon icon={faHeart} color="red" beat />
            ),
          },
        );
      } catch {
        toast.error("Something went wrong, please try again");
      }
    },
    [isAuthenticated, saveToList, isFavourited, spawnParticles],
  );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

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
          group block cursor-pointer
          rounded-2xl text-left
          opacity-0
          animate-[fadeUp_0.45s_ease_forwards]
          transition-transform duration-300
          [@media(hover:hover)]:hover:-translate-y-1
        "
        style={{
          animationDelay: delay,
        }}
      >
        <div
          ref={particleContainerRef}
          className="
            relative aspect-2/3
            overflow-hidden rounded-2xl
            bg-black
          "
        >
          {/* IMAGE */}
          <div
            className="
              absolute inset-0
              transition-transform duration-300 ease-out
              [@media(hover:hover)]:group-hover:scale-[1.04]
            "
          >
            <MediaPoster
              data={item}
              containerClassName="
                absolute inset-0 overflow-hidden
              "
            />
          </div>

          {/* HOVER CONTENT */}
          {hasHoverContent && (
            <>
              {/* OVERLAY */}
              <div
                className="
                  absolute inset-0 z-10
                  bg-gradient-to-t
                  from-white/90
                  via-white/75
                  to-white/60

                  dark:from-black/90
                  dark:via-black/85
                  dark:to-black/40

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
                  flex flex-col justify-between
                  min-h-0
                  p-5
                  text-left
                  items-start

                  transition-all duration-300

                  opacity-0 pointer-events-none

                  [@media(hover:hover)]:group-hover:opacity-100
                  [@media(hover:hover)]:group-hover:pointer-events-auto
                "
              >
                {/* TOP */}
                <div className="w-full shrink min-h-0 overflow-hidden">
                  <h3
                    className="
                      text-[1.05rem]
                      font-bold
                      leading-tight
                      line-clamp-1
                      text-gray-900
                      dark:text-white
                    "
                  >
                    {title}
                  </h3>

                  {/* RATING */}
                  {hasRating && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <FontAwesomeIcon
                        icon={faStar}
                        className="
                          w-4 h-4
                          text-light-secondary-text
                          dark:text-white
                        "
                      />

                      <span
                        className="
                          text-sm font-semibold
                          text-gray-900 dark:text-white
                        "
                      >
                        {rating}
                      </span>

                      {item.vote_count && (
                        <span
                          className="
                            text-sm
                            text-gray-700 dark:text-gray-300
                          "
                        >
                          ({(item.vote_count / 1000).toFixed(1)}
                          K)
                        </span>
                      )}
                    </div>
                  )}

                  {/* META */}
                  {hasMeta && (
                    <div
                      className="
                        mt-2
                        flex flex-col
                        items-start gap-1
                      "
                    >
                      {mediaType === "tv" && item.number_of_seasons && (
                        <span
                          className="
                              text-sm font-medium
                              text-gray-800 dark:text-gray-200
                            "
                        >
                          {item.number_of_seasons}{" "}
                          {item.number_of_seasons === 1 ? "Season" : "Seasons"}
                        </span>
                      )}

                      {mediaType === "tv" && item.number_of_episodes && (
                        <span
                          className="
                              text-sm font-medium
                              text-gray-800 dark:text-gray-200
                            "
                        >
                          {item.number_of_episodes} Episodes
                        </span>
                      )}

                      {duration && (
                        <span
                          className="
                            text-sm font-medium
                            text-gray-800 dark:text-gray-200
                          "
                        >
                          {duration} min
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* BOTTOM */}
                <div
                  className="
                    w-full
                    flex flex-col justify-end
                    flex-1 min-h-0
                  "
                >
                  {hasOverview && (
                    <p
                      className={`
                        hidden md:block
                        text-sm leading-relaxed
                        overflow-hidden break-words
                        mb-auto
                        text-gray-800 dark:text-gray-200
                        ${
                          mediaType === "tv"
                            ? "line-clamp-3 lg:line-clamp-4"
                            : "line-clamp-4 lg:line-clamp-5"
                        }
                      `}
                    >
                      {item.overview}
                    </p>
                  )}

                  {/* ACTIONS */}
                  <div className="mt-2 flex items-center gap-4 z-10">
                    {/* PLAY */}
                    <div className="relative group/play">
                      <button
                        onClick={handleTrailerOpen}
                        className="
                          bg-transparent
                          transition-all duration-200
                          hover:scale-110
                          text-light-secondary-text
                          dark:text-white
                        "
                      >
                        <FontAwesomeIcon icon={faPlay} className="w-5 h-5" />
                      </button>

                      <span
                        className="
                        hidden md:block
                        pointer-events-none
                        absolute -top-8 left-1/2
                        -translate-x-1/2
                        whitespace-nowrap
                        rounded-md
                        bg-light-card dark:bg-dark-card
                        border border-light-border dark:border-dark-border
                        px-2 py-1
                        text-[10px]
                        text-light-body-text dark:text-dark-body-text
                        opacity-0
                        transition-opacity duration-200
                        group-hover/play:opacity-100
                      "
                      >
                        Play Trailer
                      </span>
                    </div>

                    {/* FAVOURITE */}
                    <div className="relative group/fav">
                      <button
                        onClick={
                          isAuthenticated
                            ? handleFavourite
                            : (e) => {
                                e.preventDefault();
                              }
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
                              : "text-light-secondary-text dark:text-white"
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
    hidden md:block
    pointer-events-none
    absolute -top-8 left-1/2
    -translate-x-1/2
    whitespace-nowrap
    rounded-md
    bg-light-card dark:bg-dark-card
    border border-light-border dark:border-dark-border
    px-2 py-1
    text-[10px]
    text-light-body-text dark:text-dark-body-text
    opacity-0
    transition-opacity duration-200
    group-hover/fav:opacity-100
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
          <div
            className="
              absolute inset-0 z-30
              rounded-2xl
              ring-1
              ring-black/5
              dark:ring-white/5
              transition-all duration-300
              pointer-events-none
            "
          />
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
          <div
            className="
              text-sm font-semibold
              text-center
              line-clamp-2
              text-light-header
              dark:text-dark-header
            "
          >
            {title}
          </div>

          {displayTitle && (
            <div
              className="
                mt-1
                text-xs
                text-center
                line-clamp-1
                text-gray-500 dark:text-gray-400
              "
            >
              {displayTitle}
            </div>
          )}
        </div>
      </Link>
    </>
  );
}

export default memo(MediaCard);
