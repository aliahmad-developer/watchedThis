import { ITEM_WIDTH_TABLET } from "./types";

export function TrendingCarouselSkeleton() {
  return (
    <section className="relative w-full px-4" aria-label="Trending skeleton">
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-6 animate-pulse"></div>

      <div className="flex w-full items-start">
        <div className="relative overflow-hidden flex-1">
          <div className="flex gap-6 pb-6 pr-5">
            {Array.from({ length: 4 }).map((_, idx) => {
              const itemHeight = (ITEM_WIDTH_TABLET * 3) / 2;

              return (
                <div
                  key={idx}
                  className="flex flex-col flex-shrink-0"
                  style={{ width: `${ITEM_WIDTH_TABLET}px` }}
                >
                  <div className="flex">
                    <div
                      className="hidden md:flex flex-col justify-between mr-3 w-8"
                      style={{ height: `${itemHeight}px` }}
                    >
                      <div className="flex-1 flex justify-center pt-4">
                        <div className="w-4 h-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                      </div>
                      <div className="h-[50px] bg-gray-400 dark:bg-gray-600 rounded flex items-center justify-center animate-pulse">
                        <div className="w-6 h-6 bg-gray-300 dark:bg-gray-500 rounded" />
                      </div>
                    </div>

                    <div
                      className="relative rounded-lg overflow-hidden shadow-xl bg-gray-300 dark:bg-gray-700 animate-pulse"
                      style={{ width: `${ITEM_WIDTH_TABLET}px`, height: `${itemHeight}px` }}
                    >
                      <div className="absolute top-3 left-3 z-10 md:hidden w-8 h-8 bg-gray-400 dark:bg-gray-600 rounded-sm flex items-center justify-center">
                        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-500 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-4 ml-2 shrink-0">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="w-14 bg-gray-300 dark:bg-gray-700 rounded-md animate-pulse"
              style={{ height: `${(ITEM_WIDTH_TABLET * 1.5 - 16) / 2}px` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}