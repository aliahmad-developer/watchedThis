"use client";

import { useRef, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faChevronDown,
  faCheck,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { useUserList } from "../../hooks/useUserList";
import { ListStatus } from "../../../user/library/types";
import toast from "react-hot-toast";

interface ActionButtonsProps {
  mediaId: number;
  mediaType: "movie" | "tv";
  title: string;
  poster_path?: string;
  // Accept either format — detail pages return `genres`, list endpoints return `genre_ids`
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  onPlayTrailer: () => void;
}

const LIST_OPTIONS: { label: string; value: ListStatus }[] = [
  { label: "Favourite", value: "favourite" },
  { label: "Plan to Watch", value: "plan_to_watch" },
  { label: "Completed", value: "completed" },
];

export default function ActionButtons({
  mediaId,
  mediaType,
  title,
  poster_path,
  genre_ids,
  genres,
  onPlayTrailer,
}: ActionButtonsProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive genre_ids from whichever format the parent provides
  const resolvedGenreIds: number[] =
    genre_ids ?? genres?.map((g) => g.id) ?? [];

  const { currentStatus, saveToList, loading, isAuthenticated } = useUserList({
    mediaId,
    mediaType,
    title,
    poster_path,
    genre_ids: resolvedGenreIds,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
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
    <div className="flex flex-wrap items-center gap-4">
      {/* ── Play Trailer ── */}
      <button
        onClick={onPlayTrailer}
        className="
          group relative overflow-hidden
          px-5 py-2 rounded-2xl
          flex items-center gap-2
          font-semibold text-sm lg:text-base
          transition-all duration-300
          border border-transparent
          bg-light-header text-white
          hover:-translate-y-0.5 hover:shadow-xl hover:bg-light-nav
          dark:bg-dark-header dark:text-dark-bg dark:hover:bg-white
        "
      >
        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-r from-white/10 via-white/0 to-white/10" />
        <FontAwesomeIcon
          icon={faPlay}
          fixedWidth
          className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110"
        />
        <span className="relative z-10">Play Trailer</span>
      </button>

      {/* ── List Button ── */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          disabled={loading}
          className={`
            group relative overflow-hidden
            px-5 py-2 rounded-2xl
            flex items-center gap-2
            font-semibold text-sm lg:text-base
            transition-all duration-300
            border
            hover:-translate-y-0.5 hover:shadow-lg
            disabled:opacity-50
            ${
              activeOption
                ? `
                  border-light-accent/25 bg-light-card text-light-header
                  hover:border-light-accent/50 hover:bg-light-accent-muted hover:text-light-header
                  dark:border-dark-accent/25 dark:bg-dark-card dark:text-dark-header
                  dark:hover:border-dark-accent/50 dark:hover:bg-dark-accent-muted dark:hover:text-dark-header
                `
                : `
                  border-light-border bg-light-card text-light-body-text
                  hover:border-light-accent/30 hover:bg-light-bg hover:text-light-header
                  dark:border-dark-border dark:bg-dark-card dark:text-dark-body-text
                  dark:hover:border-dark-accent/30 dark:hover:bg-dark-bg dark:hover:text-dark-header
                `
            }
          `}
        >
          <span className="relative z-10">
            {activeOption ? activeOption.label : "Add to List"}
          </span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`h-3 w-3 relative z-10 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* ── Dropdown ── */}
        {open && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "calc(100% + 0.75rem)",
              width: "12rem",
              zIndex: 50,
              borderRadius: "1rem",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              backgroundColor: "light-dark(var(--color-light-bg), #18181b)",
              borderStyle: "solid",
              borderWidth: "1px",
              borderColor: "light-dark(var(--color-light-border), #27272a)",
            }}
          >
            {!isAuthenticated ? (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  color:
                    "light-dark(var(--color-light-secondary-text), #71717a)",
                }}
              >
                <FontAwesomeIcon
                  icon={faLock}
                  style={{ width: "0.75rem", height: "0.75rem", flexShrink: 0 }}
                />
                <span>Sign in to save.</span>
              </div>
            ) : (
              LIST_OPTIONS.map((option, i) => {
                const isActive = currentStatus === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                      fontSize: "0.875rem",
                      textAlign: "left",
                      cursor: "pointer",
                      borderStyle: "solid",
                      borderWidth: "0",
                      borderTopWidth: i === 0 ? "0" : "1px",
                      borderTopColor:
                        i === 0
                          ? "transparent"
                          : "light-dark(var(--color-light-border), #27272a)",
                      borderLeftWidth: "2px",
                      borderLeftColor: isActive ? "#94a3b8" : "transparent",
                      backgroundColor: isActive
                        ? "light-dark(rgba(0,0,0,0.07), rgba(255,255,255,0.08))"
                        : "transparent",
                      color: isActive
                        ? "light-dark(var(--color-light-header), #f4f4f5)"
                        : "light-dark(var(--color-light-body-text), #71717a)",
                      fontWeight: isActive ? 600 : 400,
                      transition:
                        "background-color 150ms ease, color 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor =
                          "light-dark(rgba(0,0,0,0.04), rgba(255,255,255,0.05))";
                        e.currentTarget.style.color =
                          "light-dark(var(--color-light-header), #f4f4f5)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color =
                          "light-dark(var(--color-light-body-text), #71717a)";
                      }
                    }}
                  >
                    <span>{option.label}</span>
                    {isActive && (
                      <FontAwesomeIcon
                        icon={faCheck}
                        style={{
                          width: "0.875rem",
                          height: "0.875rem",
                          color: "#94a3b8",
                          flexShrink: 0,
                        }}
                      />
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
