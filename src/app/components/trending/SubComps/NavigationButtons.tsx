import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavigationButtonsProps {
  onLeft: () => void;
  onRight: () => void;
  canGoLeft: boolean;
  canGoRight: boolean;
  itemHeight: number;
}

export function NavigationButtons({
  onLeft,
  onRight,
  canGoLeft,
  canGoRight,
  itemHeight,
}: NavigationButtonsProps) {
  const GAP = 16;
  const buttonHeight = (itemHeight - GAP) / 2;
  const baseBtnClasses =
    "w-14 rounded-md shadow-lg flex items-center justify-center transition-all duration-200";

  return (
    <div
      className="hidden md:flex flex-col ml-2 shrink-0"
      style={{ height: `${itemHeight}px`, gap: `${GAP}px` }}
    >
      <button
        onClick={onLeft}
        disabled={!canGoLeft}
        style={{ height: `${buttonHeight}px` }}
        className={`${baseBtnClasses} ${
          !canGoLeft
            ? "bg-gray-400 dark:bg-gray-600 opacity-40 cursor-not-allowed"
            : "bg-gray-500 dark:bg-gray-700 hover:bg-light-accent dark:hover:bg-dark-accent hover:scale-105 active:scale-95"
        }`}
        aria-label="Scroll left"
      >
        <ChevronLeft size={28} />
      </button>
      <button
        onClick={onRight}
        disabled={!canGoRight}
        style={{ height: `${buttonHeight}px` }}
        className={`${baseBtnClasses} ${
          !canGoRight
            ? "bg-gray-400 dark:bg-gray-600 opacity-40 cursor-not-allowed"
            : "bg-gray-500 dark:bg-gray-700 hover:bg-light-accent dark:hover:bg-dark-accent hover:scale-105 active:scale-95"
        }`}
        aria-label="Scroll right"
      >
        <ChevronRight size={28} />
      </button>
    </div>
  );
}