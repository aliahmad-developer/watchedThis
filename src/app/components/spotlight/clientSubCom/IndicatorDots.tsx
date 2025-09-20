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
      absolute z-30 flex gap-3
      /* sm: vertical, right aligned and centered vertically */
      sm:top-1/2 sm:right-6 sm:left-auto sm:bottom-auto sm:-translate-y-1/2 sm:translate-x-0 sm:flex-col

      /* lg: back to bottom-center (override sm) */
      lg:bottom-6 lg:left-1/2 lg:top-auto lg:right-auto lg:-translate-y-0 lg:-translate-x-1/2 lg:flex-row
    "
    role="tablist"
    aria-label="Slide navigation"
  >
    {items.map((_, index) => (
      <button
        key={index}
        onClick={() => goToIndex(index)}
        className={`
          relative
          w-3 h-2 rounded-full transition-all duration-300 
          ${
            index === currentIndex
              ? "bg-light-accent dark:bg-dark-accent scale-110 ring-2 ring-light-accent/20 dark:ring-dark-accent/20"
              : "bg-white/60 hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg hover:scale-105"
          }
        `}
        role="tab"
        aria-selected={index === currentIndex}
        aria-label={`Go to slide ${index + 1}`}
        aria-controls={`slide-${index}`}
        tabIndex={index === currentIndex ? 0 : -1}
      >
        <span
          className="
          absolute -top-8 left-1/2 -translate-x-1/2 
          bg-black/80 text-white text-xs px-2 py-1 rounded 
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
          pointer-events-none
        "
        >
          Slide {index + 1}
        </span>
      </button>
    ))}
  </div>
);

export default IndicatorDots;