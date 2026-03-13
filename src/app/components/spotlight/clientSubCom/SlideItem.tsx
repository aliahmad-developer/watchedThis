import { MediaItem } from "../types";
import GradientOverlay from "./GradientOverlay";
import MobileContent from "./MobileContent";
import DesktopContent from "./DesktopContent";
import Image from "next/image";

interface SlideItemProps {
  item: MediaItem;
  index: number;
  isMobile: boolean;
  rawIndex: number; 
  showSpotlightNumber: boolean;
  formatDuration: (minutes: number) => string;
  formatDate: (dateString: string | undefined) => string;
  handleWatchTrailer: (media: MediaItem) => void;
  currentIndex: number;
}

const SlideItem = ({
  item,
  index,
  isMobile,
  rawIndex,
  showSpotlightNumber,
  formatDuration,
  formatDate,
  handleWatchTrailer,
  currentIndex,
}: SlideItemProps) => {
  if (isMobile) {
    return (
      <div className="shrink-0 w-full h-full md:hidden">
        <div className="relative w-full h-full">
          {item.backdrop_path && (
            <>
              <Image
                draggable={false}
                src={`https://image.tmdb.org/t/p/w1280${item.backdrop_path}`}
                alt={item.title || item.name || "Media backdrop"}
                fill
                className="object-cover"
                sizes="100vw"
                priority={rawIndex === currentIndex || rawIndex === currentIndex + 1} 
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
        showSpotlightNumber={showSpotlightNumber}
        formatDuration={formatDuration}
        formatDate={formatDate}
        handleWatchTrailer={handleWatchTrailer}
        currentIndex={currentIndex}
        rawIndex={rawIndex}  
      />
    </div>
  );
};

export default SlideItem;
