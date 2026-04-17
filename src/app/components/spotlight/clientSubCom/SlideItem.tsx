import { MediaItem } from "../types";
import GradientOverlay from "./GradientOverlay";
import MobileContent from "./MobileContent";
import DesktopContent from "./DesktopContent";
import Image from "next/image";

interface SlideItemProps {
  item: MediaItem;
  index: number;
  rawIndex: number;
  isMobile: boolean;
  showSpotlightNumber: boolean;
  formatDuration: (minutes: number) => string;
  formatDate: (dateString: string | undefined) => string;
  handleWatchTrailer: (media: MediaItem) => void;
  currentIndex: number;
  isActive: boolean;
}

const SlideItem = ({
  item,
  index,
  rawIndex,
  isMobile,
  showSpotlightNumber,
  formatDuration,
  formatDate,
  handleWatchTrailer,
  currentIndex,
  isActive,
}: SlideItemProps) => {
  // Only prioritize the first real slide (rawIndex 1 = first real item after prepended clone)
  const shouldPrioritize = rawIndex === 1;
  const tmdbSize = isMobile ? "w780" : "w1280";

  if (isMobile) {
    return (
      <div className="shrink-0 w-full h-full md:hidden">
        <div className="relative w-full h-full">
          {item.backdrop_path && (
            <>
              <Image
                draggable={false}
                src={`https://image.tmdb.org/t/p/${tmdbSize}${item.backdrop_path}`}
                alt={item.title || item.name || "Media backdrop"}
                fill
                className="object-cover"
                sizes="100vw"
                priority={shouldPrioritize}
              />
              <GradientOverlay />
              <MobileContent
                item={item}
                index={index}
                showSpotlightNumber={showSpotlightNumber}
                handleWatchTrailer={handleWatchTrailer}
              />
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:flex shrink-0 w-full h-full">
      <DesktopContent
        item={item}
        index={index}
        rawIndex={rawIndex}
        showSpotlightNumber={showSpotlightNumber}
        formatDuration={formatDuration}
        formatDate={formatDate}
        handleWatchTrailer={handleWatchTrailer}
        currentIndex={currentIndex}
        isActive={isActive}
      />
    </div>
  );
};

export default SlideItem;