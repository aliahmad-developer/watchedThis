import { useRef, useState, useEffect } from "react";
import CastCard from "@/app/components/mediaCard/castCard";

export default function CastScroll({
  cast,
  mediaType,
}: {
  cast: any[];
  mediaType: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(10); // small buffer to keep scrollbar
  const [showGradient, setShowGradient] = useState(true);
  const CHUNK_SIZE = 10;
  

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;

      // Show/hide gradient based on how far we've scrolled
      setShowGradient(scrollLeft + clientWidth < scrollWidth - 10);

      // Load more when near the end
      if (scrollLeft + clientWidth >= scrollWidth - 100) {
        setVisibleCount((prev) => {
          if (prev >= cast.length) return prev;
          return Math.min(prev + CHUNK_SIZE, cast.length);
        });
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [cast.length]);

  return (
    <section className="mt-10 max-w-6xl mx-auto relative">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 px-1">Cast</h2>

      <div className="relative">
        <div
          ref={scrollRef}
          className="relative overflow-x-auto max-w-full scrollbar-radius-full"
        >
          <div className="flex gap-4 min-w-max pb-2">
            {cast.slice(0, visibleCount).map((actor) => (
              <div
                key={actor.id}
                className="w-28 sm:w-32 flex-shrink-0 transition-transform hover:scale-105"
              >
                <CastCard actor={actor} mediaType={mediaType} />
              </div>
            ))}
          </div>
        </div>

        {/* Gradient overlay — only if there's more content */}
        {showGradient && (
          <div
            className="absolute right-0 top-0 h-full w-20 pointer-events-none 
               bg-gradient-to-l from-[var(--color-light-bg)]/95 
               dark:from-[var(--color-dark-bg)]/95 
               via-[var(--color-light-bg)]/80 
               dark:via-[var(--color-dark-bg)]/80 
               to-transparent"
          />
        )}
      </div>
    </section>
  );
}
