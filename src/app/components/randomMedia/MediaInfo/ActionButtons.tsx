"use client";

import { useRef, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faChevronDown, faCheck, faLock } from "@fortawesome/free-solid-svg-icons";
import { useUserList } from "../../hooks/useUserList";
import { ListStatus } from "../../../user/library/types";
import toast from "react-hot-toast";

interface ActionButtonsProps {
  mediaId: number;
  mediaType: "movie" | "tv";
  title: string;
  poster_path?: string;
  onPlayTrailer: () => void;
}

const LIST_OPTIONS: { label: string; value: ListStatus }[] = [
  { label: "Favourite",     value: "favourite"     },
  { label: "Plan to Watch", value: "plan_to_watch" },
  { label: "Completed",     value: "completed"     },
];

export default function ActionButtons({
  mediaId,
  mediaType,
  title,
  poster_path,
  onPlayTrailer,
}: ActionButtonsProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { currentStatus, saveToList, loading, isAuthenticated } = useUserList({
    mediaId,
    mediaType,
    title,
    poster_path,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeOption = LIST_OPTIONS.find((o) => o.value === currentStatus);

  const handleSelect = async (status: ListStatus) => {
    if (!isAuthenticated) return;

    const option = LIST_OPTIONS.find((o) => o.value === status);
    const isRemoving = currentStatus === status;

    try {
      await saveToList(status);
      if (isRemoving) {
        toast(`Removed from ${option?.label}`, { icon: "🗑️" });
      } else {
        toast.success(`Added to ${option?.label}`);
      }
    } catch {
      toast.error("Something went wrong, please try again");
    }

    setOpen(false);
  };

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <button
        onClick={onPlayTrailer}
        className="px-4 py-2 text-sm lg:text-base rounded-full font-medium flex items-center gap-2 transition bg-light-btn-bg hover:bg-light-btn-hover-bg text-light-btn-text dark:bg-dark-btn-bg dark:hover:bg-dark-btn-hover-bg dark:text-dark-btn-text"
      >
        <FontAwesomeIcon icon={faPlay} />
        Play Trailer
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          disabled={loading}
          className="text-light-accent dark:text-dark-accent rounded-xl flex items-center gap-2 bg-light-bg dark:bg-dark-card hover:bg-light-border dark:hover:bg-dark-border px-6 py-3 font-semibold transition disabled:opacity-50"
        >
          <span>{activeOption ? activeOption.label : "Add to List"}</span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-2 w-44 rounded-xl overflow-hidden shadow-xl z-50 bg-light-bg dark:bg-dark-card border border-light-border dark:border-dark-border">
            {!isAuthenticated ? (
              <div className="px-3 py-2 flex items-center gap-2 text-sm text-gray-400">
                <FontAwesomeIcon icon={faLock} className="h-3 w-3" />
                Sign in to save.
              </div>
            ) : (
              LIST_OPTIONS.map((option) => {
                const isActive = currentStatus === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`bg-transparent text-light-secondary-text dark:text-dark-secondary-text hover:text-light-header hover:dark:text-dark-header w-full text-left px-3 py-1.5 text-sm flex items-center justify-between gap-2 transition
                      hover:bg-light-border dark:hover:bg-dark-border
                      ${isActive
                        ? "text-light-accent dark:text-dark-accent font-semibold"
                        : "text-light-text dark:text-dark-text"
                      }`}
                  >
                    {option.label}
                    {isActive && (
                      <FontAwesomeIcon icon={faCheck} className="h-3 w-3 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}