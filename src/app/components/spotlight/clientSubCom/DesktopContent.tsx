import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faClock,
  faCirclePlay,
  faPlay,
  faAngleRight,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import Link from "next/link";
import { createSlug } from "@/app/components/utilities/createSlug";
import GradientOverlay from "./GradientOverlay";
import { MediaItem } from "../types";

interface DesktopContentProps {
  item: MediaItem;
  index: number;
  rawIndex: number;
  showSpotlightNumber: boolean;
  formatDuration: (minutes: number) => string;
  formatDate: (dateString: string | undefined) => string;
  handleWatchTrailer: (media: MediaItem) => void;
  currentIndex: number;
  isActive: boolean;
}

const DesktopContent = ({
  item,
  index,
  rawIndex,
  showSpotlightNumber,
  formatDuration,
  formatDate,
  handleWatchTrailer,
  currentIndex,
  isActive,
}: DesktopContentProps) => {
  // Prioritize active slide and its immediate next neighbour
  const shouldPrioritize = isActive || rawIndex === currentIndex + 1;

  return (
    <>
      <div className="flex items-center px-8 lg:px-10 w-full md:w-1/2 z-20 relative">
        <div className="space-y-4 lg:space-y-5 max-w-xl">
          {showSpotlightNumber && (
            <div className="text-md font-medium text-light-header dark:text-dark-disabled">
              #{index + 1} Spotlight
            </div>
          )}
          <h2 className="text-2xl lg:text-4xl font-bold text-light-header dark:text-white leading-tight line-clamp-2 min-h-12 lg:min-h-14">
            {item.title || item.name}
          </h2>
          <div className="flex flex-wrap items-center gap-3 lg:gap-6 text-sm text-light-secondary-text dark:text-dark-secondary-text">
            <div className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faCirclePlay} className="w-4 h-4" />
              <span>{(item.media_type || "movie").toUpperCase()}</span>
            </div>
            {item.runtime && (
              <div className="inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
                <span>{formatDuration(item.runtime)}</span>
              </div>
            )}
            <div className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendar} className="w-4 h-4" />
              <span>{formatDate(item.release_date || item.first_air_date)}</span>
            </div>
          </div>
          <p className="text-base line-clamp-2 opacity-90 text-light-body-text dark:text-dark-body-text leading-relaxed">
            {item.overview}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => handleWatchTrailer(item)}
              className="px-4 py-2 text-base rounded-full font-medium flex items-center gap-2 transition bg-light-btn-bg hover:bg-light-btn-hover-bg text-light-btn-text dark:bg-dark-btn-bg dark:hover:bg-dark-btn-hover-bg dark:text-dark-btn-text"
            >
              <FontAwesomeIcon icon={faPlay} className="w-5 h-5" />
              Watch Trailer
            </button>
            <Link
              href={`/${item.media_type || "movie"}/${createSlug(
                item.title || item.name || ""
              )}/${item.id}`}
              className="px-4 py-2 text-base rounded-full font-medium transition bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-light-body-text dark:text-dark-body-text flex items-center gap-2"
            >
              Details
              <FontAwesomeIcon icon={faAngleRight} className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden md:block relative w-4/5 h-full">
        {item.backdrop_path && (
          <>
            <Image
              draggable={false}
              src={`https://image.tmdb.org/t/p/w1280${item.backdrop_path}`}
              alt={item.title || item.name || "Media backdrop"}
              fill
              className="object-cover object-right"
              sizes="40vw"
              priority={shouldPrioritize}
            />
            <GradientOverlay />
          </>
        )}
      </div>
    </>
  );
};

export default DesktopContent;