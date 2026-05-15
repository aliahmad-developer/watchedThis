"use client";
import Image from "next/image";
import Link from "next/link";
import { memo, useMemo } from "react";
import { MediaItem } from "./types";
import { trackClick } from "@/app/components/Recommendation/behaviourTracker";
import { tmdbImage } from "@/lib/imageTmdb";

interface CarouselItemProps {
  item: MediaItem;
  position: number;
  isPriority: boolean;
  itemWidth: number;
  showSidebar: boolean;
}

export const CarouselItem = memo(function CarouselItem({
  item,
  position,
  isPriority,
  itemWidth,
  showSidebar,
}: CarouselItemProps) {
  const { href, posterWidth, itemHeight } = useMemo(() => {
    const mediaType = item.title ? "movie" : "tv";
    const mediaTitle = (item.title || item.name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const posterWidth = showSidebar ? itemWidth - 44 : itemWidth;
    const itemHeight = (posterWidth * 3) / 2;
    return {
      href: `/${mediaType}/${mediaTitle}/${item.id}`,
      mediaTitle,
      posterWidth,
      itemHeight,
    };
  }, [item.title, item.name, item.id, itemWidth, showSidebar]);

  return (
    <div
      className="flex flex-col shrink-0 transition-transform duration-300 ease-out"
      style={{ width: `${itemWidth}px` }}
      tabIndex={0}
      aria-label={`${item.title || item.name}, position ${position}`}
    >
      <div className="flex">
        {showSidebar && (
          <div
            className="hidden md:flex flex-col justify-between mr-3 w-8"
            style={{ height: `${itemHeight}px` }}
          >
            <div
              className="flex justify-center pt-4 overflow-hidden"
              style={{ height: `${itemHeight - 50}px` }} 
            >
              <p
                className="cursor-default text-sm font-semibold rotate-180 [writing-mode:vertical-lr] whitespace-nowrap
                 text-light-accent dark:text-dark-accent"
                style={{
                  maxHeight: "100%",
                  overflow: "hidden",
                  maskImage:
                    "linear-gradient(to top, transparent 0%, black 20%)",
                  WebkitMaskImage:
                    "linear-gradient(to top, transparent 0%, black 20%)",
                }}
                title={item.title || item.name}
              >
                {item.title || item.name}
              </p>
            </div>
            <p className="cursor-default text-black dark:text-white text-xl font-bold text-center h-12.5 flex items-center justify-center shrink-0">
              {String(position).padStart(2, "0")}
            </p>
          </div>
        )}

        <Link
          href={href}
          className="relative lg:md:rounded-lg overflow-hidden shadow-xl block hover:scale-105 transition-transform duration-300 ease-out"
          style={{ width: `${posterWidth}px`, height: `${itemHeight}px` }}
          prefetch={isPriority}
          onClick={() => trackClick(item.id, item.title ? "movie" : "tv")}
        >
          <div className="absolute top-0 left-0 z-10 md:hidden w-8 h-8 bg-black/70 flex items-center justify-center">
            <span className="text-light-accent dark:text-dark-accent font-bold text-sm">
              {position}
            </span>
          </div>

          {item.poster_path ? (
            <Image
              draggable={false}
              src={tmdbImage(item.poster_path, "w500")!}
              alt={item.title || item.name || "Media poster"}
              fill
              className="object-cover"
              sizes={`(max-width: 640px) ${itemWidth}px, (max-width: 768px) ${itemWidth}px, 33vw`}
              priority={isPriority}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                No image
              </span>
            </div>
          )}
        </Link>
      </div>
    </div>
  );
});
