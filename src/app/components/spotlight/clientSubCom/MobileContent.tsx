import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { createSlug } from "@/app/components/utilities/createSlug";
import { MediaItem } from "../types";

interface MobileContentProps {
  item: MediaItem;
  index: number;
  showSpotlightNumber: boolean;
  handleWatchTrailer: (media: MediaItem) => void;
}

const MobileContent = ({
  item,
  index,
  showSpotlightNumber,
  handleWatchTrailer,
}: MobileContentProps) => (
  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
    <div className="space-y-2">
      {showSpotlightNumber && (
        <div className="text-xs font-medium text-light-header dark:text-dark-disabled">
          #{index + 1} Spotlight
        </div>
      )}
      <h2 className="text-lg font-bold text-light-header dark:text-white leading-tight line-clamp-1 min-h-[1.75rem]">
        {item.title || item.name}
      </h2>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => handleWatchTrailer(item)}
          className="px-3 py-1 text-xs rounded-full font-medium flex items-center gap-1 bg-light-btn-bg hover:bg-light-btn-bg-hover text-light-btn-text dark:bg-dark-btn-bg dark:hover:bg-dark-btn-bg-hover dark:text-dark-btn-text"
        >
          <FontAwesomeIcon icon={faPlay} className="w-3 h-3" />
          Watch Trailer
        </button>
        <Link
          href={`/${item.media_type}/${createSlug(
            item.title || item.name || ""
          )}/${item.id}`}
          className="px-3 py-1 text-xs rounded-full font-medium flex items-center gap-1 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-white"
        >
          Details
          <FontAwesomeIcon icon={faAngleRight} className="w-2 h-2" />
        </Link>
      </div>
    </div>
  </div>
);

export default MobileContent;