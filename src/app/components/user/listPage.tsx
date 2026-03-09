"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useUserLists, ListItem } from "../hooks/useUserLists";
import { ListStatus } from "../../user/lists/types";
import AuthPage from "../auth/authPage";
import MediaCard from "../../components/mediaCard/mediaCard";

const FILTERS: { label: string; value: ListStatus }[] = [
  { label: "Favourites",    value: "favourite"     },
  { label: "Plan to Watch", value: "plan_to_watch" },
  { label: "Completed",     value: "completed"     },
];

export default function ListsPage() {
  const { items, loading, isAuthenticated, authLoading, removeItem } = useUserLists();
  const [activeFilter, setActiveFilter] = useState<ListStatus>("favourite");
  const [removing, setRemoving] = useState<number | null>(null);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 rounded-full border-2 border-light-accent dark:border-dark-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm">
          Sign in to view your lists
        </p>
        <div className="w-full max-w-md">
          <AuthPage />
        </div>
      </div>
    );
  }

  const filtered = items.filter((item) => item.status === activeFilter);

  const handleRemove = async (e: React.MouseEvent, mediaId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setRemoving(mediaId);
    await removeItem(mediaId);
    setRemoving(null);
  };

  return (
    <div className="max-w-5xl mx-auto w-full">
      {/* Filter buttons */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {FILTERS.map(({ label, value }) => {
          const count = items.filter((i) => i.status === value).length;
          const isActive = activeFilter === value;
          return (
            <button
              key={value}
              onClick={() => setActiveFilter(value)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium text-sm transition
                ${isActive
                  ? "bg-light-accent dark:bg-dark-accent text-white"
                  : "bg-light-card dark:bg-dark-card text-light-secondary-text dark:text-dark-secondary-text hover:bg-light-border dark:hover:bg-dark-border"
                }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-light-border dark:bg-dark-border"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-2/3 rounded-xl bg-light-card dark:bg-dark-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm">
            Nothing in {FILTERS.find((f) => f.value === activeFilter)?.label} yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {filtered.map((item) => (
            <div key={item.mediaId} className="relative group">
              <MediaCard
                item={{
                  id: item.mediaId,
                  title: item.mediaType === "movie" ? item.title : undefined,
                  name: item.mediaType === "tv" ? item.title : undefined,
                  poster_path: item.poster_path,
                  media_type: item.mediaType,
                }}
              />
              {/* Remove button — appears on hover */}
              <button
                onClick={(e) => handleRemove(e, item.mediaId)}
                disabled={removing === item.mediaId}
                className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center
                  rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100
                  transition-opacity hover:bg-red-500 disabled:opacity-50"
                title="Remove from list"
              >
                {removing === item.mediaId
                  ? <div className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
                  : <FontAwesomeIcon icon={faTimes} className="h-2.5 w-2.5" />
                }
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}