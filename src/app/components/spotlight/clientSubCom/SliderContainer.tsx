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
  // [clone of last, ...real items, clone of first]
  // prepended clone lets us slide left from index 0 to -1 naturally
  // appended clone lets us slide right from last to items.length naturally
  const clonedItems = [items[items.length - 1], ...items, items[0]];

  return (
    <div className="relative w-full h-full overflow-hidden" ref={sliderRef}>
      <div
        className="flex w-full h-full"
        style={{
          // +1 to offset the prepended clone so index 0 maps to the first real slide
          transform: `translateX(-${(currentIndex + 1) * 100}%)`,
          transition: isTransitioning ? "transform 500ms ease-in-out" : "none",
        }}
      >
        {clonedItems.map((item, index) => {
          // Map cloned array positions back to real item indexes for spotlight numbers etc.
          // index 0 = prepended clone of last item → real index: items.length - 1
          // index 1..items.length = real items → real index: index - 1
          // index items.length + 1 = appended clone of first item → real index: 0
          const realItemIndex =
            index === 0
              ? items.length - 1
              : (index - 1) % items.length;

          // Active slide: currentIndex + 1 because of the prepended clone offset
          const isActive = index === currentIndex + 1;

          return (
            <SlideItem
              key={`${item.id}-${index}`}
              item={item}
              index={realItemIndex}
              rawIndex={index}
              isMobile={isMobile}
              showSpotlightNumber={showSpotlightNumber}
              formatDuration={formatDuration}
              formatDate={formatDate}
              handleWatchTrailer={handleWatchTrailer}
              currentIndex={currentIndex + 1}
              isActive={isActive}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SliderContainer;