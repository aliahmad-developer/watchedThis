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
}: SliderContainerProps) => {
  return (
    <div className="relative w-full h-full overflow-hidden" ref={sliderRef}>
      <div
        className="flex w-full h-full transition-transform duration-500 ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {items.map((item, index) => (
          <SlideItem
            key={item.id}
            item={item}
            index={index}
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