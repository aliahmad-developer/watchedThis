"use client";

import { useRouter } from "next/navigation";
import { TmdbImage } from "../utilities/TmdbImage";
import { SpinnerItem } from "./types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { tmdbImage } from "@/lib/imageTmdb";

interface ResultModalProps {
  item: SpinnerItem;
  onClose: () => void;
}

export default function ResultModal({ item, onClose }: ResultModalProps) {
  const router = useRouter();
  const slug = item.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const href = `/${item.mediaType}/${slug}/${item.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border shadow-2xl">
        {item.poster_path && (
          <div className="relative w-full aspect-video overflow-hidden">
            <TmdbImage
              src={tmdbImage(item.poster_path, "w500")!}
              alt={item.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-light-bg dark:from-dark-bg to-transparent" />
          </div>
        )}
        <div className="px-6 pb-6 -mt-8 relative">
          <p className="text-xs font-medium text-light-accent dark:text-dark-accent uppercase tracking-wider mb-1">
            The wheel chose
          </p>
          <h2 className="text-light-text dark:text-dark-text mb-4">
            {item.title}
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => {
                router.push(href);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-light-accent dark:bg-dark-accent text-white font-semibold text-sm hover:opacity-90 transition"
            >
              View Details
              <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
            </button>
            <button
              onClick={onClose}
              className="w-12 flex items-center justify-center rounded-xl bg-light-card dark:bg-dark-card hover:bg-light-border dark:hover:bg-dark-border transition"
            >
              <FontAwesomeIcon
                icon={faTimes}
                className="h-4 w-4 text-light-secondary-text dark:text-dark-secondary-text"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
