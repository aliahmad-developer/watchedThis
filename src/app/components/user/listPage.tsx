"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faTimes } from "@fortawesome/free-solid-svg-icons";

import { useUserLists } from "../hooks/useUserLists";

import { ListStatus } from "../../user/library/types";

import AuthPage from "../auth/authPage";

import MediaCard from "../../components/mediaCard/mediaCard";

const FILTERS: {
  label: string;
  value: ListStatus;
}[] = [
  {
    label: "Favourites",
    value: "favourite",
  },

  {
    label: "Plan to Watch",
    value: "plan_to_watch",
  },

  {
    label: "Completed",
    value: "completed",
  },
];

interface LibraryCardItem {
  mediaId: number;
  mediaType: "movie" | "tv";
  title: string;
  poster_path?: string;
  status: ListStatus;
}

const LoadingGrid = memo(function LoadingGrid() {
  return (
    <div
      className="
        grid
        grid-cols-3
        sm:grid-cols-4
        md:grid-cols-5
        lg:grid-cols-6
        gap-2
      "
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="
              aspect-2/3
              rounded-xl
              bg-light-card dark:bg-dark-card
              animate-pulse
            "
        />
      ))}
    </div>
  );
});

const EmptyState = memo(function EmptyState({ label }: { label: string }) {
  return (
    <div
      className="
        flex flex-col
        items-center justify-center
        py-24 gap-3
        text-center
      "
    >
      <p
        className="
          text-sm
          text-light-secondary-text
          dark:text-dark-secondary-text
        "
      >
        Nothing in {label} yet.
      </p>
    </div>
  );
});

const LibraryCard = memo(function LibraryCard({
  item,
  removing,
  onRemove,
}: {
  item: LibraryCardItem;

  removing: boolean;

  onRemove: (e: React.MouseEvent, mediaId: number) => Promise<void>;
}) {
  const mediaItem = useMemo(
    () => ({
      id: item.mediaId,

      title: item.mediaType === "movie" ? item.title : undefined,

      name: item.mediaType === "tv" ? item.title : undefined,

      poster_path: item.poster_path,

      media_type: item.mediaType,
    }),
    [item],
  );

  return (
    <div className="relative group">
      <MediaCard item={mediaItem} />

      <button
        onClick={(e) => onRemove(e, item.mediaId)}
        disabled={removing}
        title="Remove from library"
        className="
          absolute top-1.5 right-1.5
          z-10

          w-6 h-6

          flex items-center justify-center

          rounded-full

          bg-black/60
          text-white

          opacity-100
          sm:opacity-0
          sm:group-hover:opacity-100
          sm:transition-opacity

          hover:bg-red-500

          disabled:opacity-50
        "
      >
        {removing ? (
          <div
            className="
              w-3 h-3
              rounded-full

              border border-white
              border-t-transparent

              animate-spin
            "
          />
        ) : (
          <FontAwesomeIcon icon={faTimes} className="h-2.5 w-2.5" />
        )}
      </button>
    </div>
  );
});

export default function ListsPage() {
  const { items, loading, isAuthenticated, authLoading, removeItem } =
    useUserLists();

  const [activeFilter, setActiveFilter] = useState<ListStatus>("favourite");

  const [removing, setRemoving] = useState<number | null>(null);

  const counts = useMemo(() => {
    return {
      favourite: items.filter((i) => i.status === "favourite").length,

      plan_to_watch: items.filter((i) => i.status === "plan_to_watch").length,

      completed: items.filter((i) => i.status === "completed").length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => item.status === activeFilter);
  }, [items, activeFilter]);

  const activeLabel = useMemo(() => {
    return FILTERS.find((f) => f.value === activeFilter)?.label ?? "";
  }, [activeFilter]);

  const handleRemove = useCallback(
    async (e: React.MouseEvent, mediaId: number) => {
      e.preventDefault();

      e.stopPropagation();

      setRemoving(mediaId);

      try {
        await removeItem(mediaId);
      } finally {
        setRemoving(null);
      }
    },
    [removeItem],
  );

  if (authLoading) {
    return (
      <div
        className="
          flex items-center justify-center
          min-h-[40vh]
        "
      >
        <div
          className="
            w-8 h-8
            rounded-full

            border-2
            border-light-accent
            dark:border-dark-accent

            border-t-transparent

            animate-spin
          "
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className="
          flex flex-col
          items-center
          gap-4
        "
      >
        <p
          className="
            text-sm
            text-light-secondary-text
            dark:text-dark-secondary-text
          "
        >
          Sign in to visit your library.
        </p>

        <div className="w-full max-w-md">
          <AuthPage />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full">
      {/* FILTERS */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {FILTERS.map(({ label, value }) => {
          const count = counts[value];

          const isActive = activeFilter === value;

          return (
            <button
              key={value}
              onClick={() => setActiveFilter(value)}
              className={`
                  flex items-center gap-2

                  px-5 py-2
                  rounded-full

                  font-medium text-sm
                  transition

                  ${
                    isActive
                      ? `
                        bg-light-accent
                        dark:bg-dark-accent
                        text-white
                      `
                      : `
                        bg-light-card
                        dark:bg-dark-card

                        text-light-secondary-text
                        dark:text-dark-secondary-text

                        hover:bg-light-border
                        dark:hover:bg-dark-border
                      `
                  }
                `}
            >
              {label}

              <span
                className={`
                    text-xs
                    px-1.5 py-0.5
                    rounded-full

                    ${
                      isActive
                        ? "bg-white/20"
                        : `
                          bg-light-border
                          dark:bg-dark-border
                        `
                    }
                  `}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* LOADING */}
      {loading ? (
        <LoadingGrid />
      ) : filtered.length === 0 ? (
        <EmptyState label={activeLabel} />
      ) : (
        <div
          className="
            grid
            grid-cols-3
            sm:grid-cols-4
            md:grid-cols-5
            lg:grid-cols-6
            gap-2
          "
        >
          {filtered.map((item) => (
            <LibraryCard
              key={item.mediaId}
              item={item}
              removing={removing === item.mediaId}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
