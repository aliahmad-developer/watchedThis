import { MediaItem } from "../types";
import SlideItem from "./SlideItem";
import { RefObject } from "react";

interface SliderContainerProps {
  items: MediaItem[];
  currentIndex: number;
  sliderRef: RefObject<HTMLDivElement | null>;
  isMobile: boolean;
  showSpotlightNumber: boolean;
  formatDuration: (minutes: number) => string;
  formatDate: (dateString: string | undefined) => string;
  handleWatchTrailer: (media: MediaItem) => void;
  isTransitioning: boolean;
}

const SliderContainer = ({
  items,
  currentIndex,
  sliderRef,
  isMobile,
  showSpotlightNumber,
  formatDuration,
  formatDate,
  handleWatchTrailer,
  isTransitioning,
}: SliderContainerProps) => {
  // Append clone of first slide at the end so last→first feels forward
  const clonedItems = [...items, items[0]];

  return (
    <div className="relative w-full h-full overflow-hidden" ref={sliderRef}>
      <div
        className="flex w-full h-full"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          // Kill transition during the instant snap-back (index reset)
          transition: isTransitioning ? "transform 500ms ease-in-out" : "none",
        }}
      >
        {clonedItems.map((item, index) => (
          <SlideItem
            key={`${item.id}-${index}`}
            item={item}
            index={index % items.length} // keep real index for spotlight number
            isMobile={isMobile}
            showSpotlightNumber={showSpotlightNumber}
            formatDuration={formatDuration}
            formatDate={formatDate}
            handleWatchTrailer={handleWatchTrailer}
            currentIndex={currentIndex}
          />
        ))}
      </div>
    </div>
  );
};

export default SliderContainer;