import { MediaItem } from "../types";

interface IndicatorDotsProps {
  items: MediaItem[];
  currentIndex: number;
  goToIndex: (index: number) => void;
}

const IndicatorDots = ({
  items,
  currentIndex,
  goToIndex,
}: IndicatorDotsProps) => (
  <div
    className="
      absolute z-30 flex gap-2
      /* Mobile & Tablet: vertical, right aligned, compact */
      top-1/2 right-3 -translate-y-1/2 flex-col
      /* Large devices: horizontal bottom-center */
      lg:bottom-4 lg:left-1/2 lg:top-auto lg:right-auto lg:-translate-x-1/2 lg:translate-y-0 lg:flex-row
    "
    role="tablist"
    aria-label="Slide navigation"
  >
    {items.map((_, index) => (
      <button
        key={index}
        onClick={() => goToIndex(index)}
        className={`
          relative group rounded-full
          transition-all duration-300 ease-out
          /* Mobile & Tablet: small round dots */
          w-2 h-2 rounded-full 
          /* Large devices: slightly larger */
          lg:w-2.5 lg:h-2.5
          
          ${
            index === currentIndex
              ? "bg-light-accent dark:bg-dark-accent scale-125"
              : "bg-gray-400 hover:bg-light-btn-hover-bg dark:bg-gray-400/60 dark:hover:bg-dark-btn-hover-bg hover:scale-110"
          }
        `}
        role="tab"
        aria-selected={index === currentIndex}
        aria-label={`Go to slide ${index + 1}`}
        aria-controls={`slide-${index}`}
        tabIndex={index === currentIndex ? 0 : -1}
      ></button>
    ))}
  </div>
);

export default IndicatorDots;
