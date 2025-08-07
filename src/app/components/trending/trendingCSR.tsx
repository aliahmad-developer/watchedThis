"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MediaItem {
  id: string;
  poster_path?: string;
  title?: string;
  name?: string;
}

const ITEM_WIDTH = 260 + 24; // 260 width + 24 gap
const VISIBLE_COUNT = 4;

export default function TrendingCarouselClient({
  media,
}: {
  media: MediaItem[];
}) {
  const [index, setIndex] = useState(0);

  const maxIndex = Math.max(0, media.length - VISIBLE_COUNT);
  const canGoLeft = index > 0;
  const canGoRight = index < maxIndex;

  const scrollLeft = () => {
    if (canGoLeft) setIndex((prev) => Math.max(0, prev - 1));
  };

  const scrollRight = () => {
    if (canGoRight) setIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  return (
    <section className="relative px-4 py-6 w-full">
      <h2 className="text-2xl font-bold mb-6">Trending</h2>

      <div className="flex w-full items-start">
        {/* Carousel area */}
        <div className="relative overflow-hidden flex-1">
          <div
            className="flex gap-6 transition-transform duration-500 ease-in-out pb-6 pr-4"
            style={{
              transform: `translateX(-${index * ITEM_WIDTH}px)`,
              width: `${media.length * ITEM_WIDTH}px`,
            }}
          >
            {media.map((item, idx) => (
              <div
                key={item.id}
                className="flex flex-col flex-shrink-0"
                style={{ width: "260px", scrollSnapAlign: "start" }}
              >
                <div className="flex h-[380px]">
                  {/* Title area */}
                  <div className="flex flex-col justify-between h-full mr-3 w-8">
                    <div className="h-[320px] flex">
                      <p className="text-sm font-semibold rotate-180 [writing-mode:vertical-lr] whitespace-nowrap text-light-accent dark:text-dark-accent">
                        {item.title || item.name}
                      </p>
                    </div>
                    <p className="text-black dark:text-white text-xl font-bold text-center h-[60px] flex items-center justify-center">
                      {String(idx + 1).padStart(2, "0")}
                    </p>
                  </div>

                  {/* Poster */}
                  <div className="relative w-[242px] h-full rounded-lg overflow-hidden shadow-xl">
                    {item.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                        alt={item.title || item.name || "Media poster"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        priority={idx < 4}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">No image</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-4 ml-2 shrink-0">
          <button
            onClick={scrollLeft}
            disabled={!canGoLeft}
            className={`w-12 h-[180px] bg-gray-500 dark:bg-gray-800 rounded-md shadow-lg transition-transform flex items-center justify-center
              ${
                !canGoLeft
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-light-accent dark:hover:bg-dark-accent"
              }
            `}
            aria-label="Scroll left"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={scrollRight}
            disabled={!canGoRight}
            className={`w-12 h-[180px] bg-gray-500 dark:bg-gray-800 rounded-md shadow-lg transition-transform flex items-center justify-center
              ${
                !canGoRight
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-light-accent dark:hover:bg-dark-accent"
              }
            `}
            aria-label="Scroll right"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      </div>
    </section>
  );
}
