import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavigationControlsProps {
  isMobile: boolean;
  isTransitioning: boolean;
  goToPrev: () => void;
  goToNext: () => void;
}

const NavigationControls = ({
  isMobile,
  isTransitioning,
  goToPrev,
  goToNext,
}: NavigationControlsProps) => {
  if (isMobile) {
    return (
      <div className="md:hidden absolute bottom-2 right-2 flex flex-row gap-1 z-30">
        <NavButton
          onClick={goToPrev}
          disabled={isTransitioning}
          ariaLabel="Previous slide"
        >
          <ChevronLeft className="w-3 h-3 text-black dark:text-white" />
        </NavButton>
        <NavButton
          onClick={goToNext}
          disabled={isTransitioning}
          ariaLabel="Next slide"
        >
          <ChevronRight className="w-3 h-3 text-black dark:text-white" />
        </NavButton>
      </div>
    );
  }

  return (
    <div className="hidden md:flex absolute bottom-4 right-4 flex-col gap-3 z-30">
      <NavButton
        onClick={goToPrev}
        disabled={isTransitioning}
        ariaLabel="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 text-black dark:text-white" />
      </NavButton>
      <NavButton
        onClick={goToNext}
        disabled={isTransitioning}
        ariaLabel="Next slide"
      >
        <ChevronRight className="w-5 h-5 text-black dark:text-white" />
      </NavButton>
    </div>
  );
};

interface NavButtonProps {
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}

const NavButton = ({
  onClick,
  disabled,
  ariaLabel,
  children,
}: NavButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="bg-black/20 hover:bg-black/30 dark:bg-white/20 dark:hover:bg-white/30 p-2 rounded-full transition disabled:opacity-50"
    aria-label={ariaLabel}
  >
    {children}
  </button>
);

export default NavigationControls;