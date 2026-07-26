"use client";

import { useState, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faFilm,
  faTv,
  faStar,
  faCalendar,
  faChevronLeft,
  faPlus,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import { SpinnerItem } from "./types";
import { TmdbImage } from "../utilities/TmdbImage";
import { tmdbImage } from "@/lib/imageTmdb";

interface Filters {
  mediaType: "movie" | "tv";
  genres: number[];
  yearRange: [number, number];
  ratingRange: [number, number];
  sortBy: string;
}

const MOVIE_GENRES: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Drama: 18,
  Fantasy: 14,
  Horror: 27,
  Mystery: 9648,
  Romance: 10749,
  "Sci-Fi": 878,
  Thriller: 53,
};
const TV_GENRES: Record<string, number> = {
  "Action & Adventure": 10759,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Drama: 18,
  "Sci-Fi & Fantasy": 10765,
  Kids: 10762,
  Mystery: 9648,
  Reality: 10764,
  Western: 37,
  Documentary: 99,
};
const SORT_OPTIONS = [
  { label: "Most Popular", value: "popularity.desc" },
  { label: "Top Rated", value: "vote_average.desc" },
  { label: "Newest First", value: "primary_release_date.desc" },
  { label: "Oldest First", value: "primary_release_date.asc" },
];
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1950;

function DualRangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatLabel,
}: {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  formatLabel?: (v: number) => string;
}) {
  const [low, high] = value;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const fmt = formatLabel ?? String;
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-xs font-semibold text-light-text dark:text-dark-text">
        <span>{fmt(low)}</span>
        <span>{fmt(high)}</span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute w-full h-1.5 rounded-full bg-light-border dark:bg-dark-border" />
        <div
          className="absolute h-1.5 rounded-full bg-light-accent dark:bg-dark-accent"
          style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(e) =>
            onChange([Math.min(Number(e.target.value), high - step), high])
          }
          className="dual-thumb absolute w-full appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: low > max - (max - min) * 0.1 ? 5 : 3 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(e) =>
            onChange([low, Math.max(Number(e.target.value), low + step)])
          }
          className="dual-thumb absolute w-full appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: 4 }}
        />
      </div>
    </div>
  );
}

interface FindPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: SpinnerItem) => void;
}

interface TMDBResult {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  media_type?: string;
}

export default function FindPanel({ isOpen, onClose, onAdd }: FindPanelProps) {
  const [filters, setFilters] = useState<Filters>({
    mediaType: "movie",
    genres: [],
    yearRange: [MIN_YEAR, CURRENT_YEAR],
    ratingRange: [0, 10],
    sortBy: "popularity.desc",
  });
  const [results, setResults] = useState<SpinnerItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const toggleGenre = (id: number) =>
    setFilters((prev) => ({
      ...prev,
      genres: prev.genres.includes(id)
        ? prev.genres.filter((g) => g !== id)
        : [...prev.genres, id],
    }));

  const handleSearch = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setSearching(true);
    setSearched(false);

    try {
      const params = new URLSearchParams({
        mediaType: filters.mediaType,
        sortBy: filters.sortBy,
        minYear: String(filters.yearRange[0]),
        maxYear: String(filters.yearRange[1]),
        minRating: String(filters.ratingRange[0]),
        maxRating: String(filters.ratingRange[1]),
      });
      if (filters.genres.length) params.set("genres", filters.genres.join(","));

      const res = await fetch(
        `/find/results?${params.toString()}&format=json`,
        {
          signal: abortRef.current.signal,
        },
      );

      // fallback: use /api/search or discover directly
      const discoverParams = new URLSearchParams({
        api_key: "", // handled server-side
        sort_by: filters.sortBy,
        "vote_average.gte": String(filters.ratingRange[0]),
        "vote_average.lte": String(filters.ratingRange[1]),
        "primary_release_date.gte": `${filters.yearRange[0]}-01-01`,
        "primary_release_date.lte": `${filters.yearRange[1]}-12-31`,
      });
      if (filters.genres.length)
        discoverParams.set("with_genres", filters.genres.join(","));

      const discoverRes = await fetch(
        `/api/discovery?mediaType=${filters.mediaType}&${discoverParams.toString()}`,
        { signal: abortRef.current.signal },
      );
      const data = await discoverRes.json();

      const items: SpinnerItem[] = (data.results || [])
        .filter((r: TMDBResult) => r.poster_path)
        .slice(0, 20)
        .map((r: TMDBResult) => ({
          id: r.id,
          mediaType: filters.mediaType,
          title: r.title || r.name || "Untitled",
          poster_path: r.poster_path,
        }));

      setResults(items);
      setSearched(true);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") setResults([]);
    } finally {
      setSearching(false);
    }
  }, [filters]);

  const genres = filters.mediaType === "movie" ? MOVIE_GENRES : TV_GENRES;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 left-0 h-full z-40 w-full max-w-sm
          bg-light-bg dark:bg-dark-bg border-r border-light-border dark:border-dark-border
          shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-border shrink-0">
          <h2 className="text-base">Find Media</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-light-border dark:hover:bg-dark-border transition text-light-secondary-text dark:text-dark-secondary-text"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable filters */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Type */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-light-secondary-text dark:text-dark-secondary-text mb-2 flex items-center gap-1.5">
              <FontAwesomeIcon
                icon={faFilm}
                className="h-3 text-light-accent dark:text-dark-accent"
              />
              Type
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["movie", "tv"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      mediaType: type,
                      genres: [],
                    }))
                  }
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition-all
                    ${
                      filters.mediaType === type
                        ? "bg-light-accent dark:bg-dark-accent text-white border-transparent"
                        : "bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border text-light-secondary-text dark:text-dark-secondary-text hover:border-light-accent dark:hover:border-dark-accent"
                    }`}
                >
                  <FontAwesomeIcon
                    icon={type === "movie" ? faFilm : faTv}
                    className="h-3"
                  />
                  {type === "movie" ? "Movies" : "TV Shows"}
                </button>
              ))}
            </div>
          </div>

          {/* Genres */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-light-secondary-text dark:text-dark-secondary-text mb-2 flex items-center gap-1.5">
              <FontAwesomeIcon
                icon={faTag}
                className="h-3 text-light-accent dark:text-dark-accent"
              />
              Genres
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(genres).map(([name, id]) => (
                <button
                  key={id}
                  onClick={() => toggleGenre(id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all
                    ${
                      filters.genres.includes(id)
                        ? "bg-light-accent dark:bg-dark-accent text-white border-transparent"
                        : "bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border text-light-secondary-text dark:text-dark-secondary-text hover:border-light-accent dark:hover:border-dark-accent"
                    }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Year */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-light-secondary-text dark:text-dark-secondary-text mb-2 flex items-center gap-1.5">
              <FontAwesomeIcon
                icon={faCalendar}
                className="h-3 text-light-accent dark:text-dark-accent"
              />
              Release Year
            </p>
            <DualRangeSlider
              min={MIN_YEAR}
              max={CURRENT_YEAR}
              value={filters.yearRange}
              onChange={(v) =>
                setFilters((prev) => ({ ...prev, yearRange: v }))
              }
            />
          </div>

          {/* Rating */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-light-secondary-text dark:text-dark-secondary-text mb-2 flex items-center gap-1.5">
              <FontAwesomeIcon
                icon={faStar}
                className="h-3 text-light-accent dark:text-dark-accent"
              />
              Rating
            </p>
            <DualRangeSlider
              min={0}
              max={10}
              step={0.5}
              value={filters.ratingRange}
              onChange={(v) =>
                setFilters((prev) => ({ ...prev, ratingRange: v }))
              }
              formatLabel={(v) => `${v}★`}
            />
          </div>

          {/* Sort */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-light-secondary-text dark:text-dark-secondary-text mb-2">
              Sort By
            </p>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, sortBy: e.target.value }))
              }
              className="w-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl px-3 py-2 text-sm text-light-text dark:text-dark-text outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            disabled={searching}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-light-accent dark:bg-dark-accent text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            <FontAwesomeIcon
              icon={faSearch}
              className={`h-3.5 ${searching ? "animate-spin" : ""}`}
            />
            {searching ? "Searching…" : "Search"}
          </button>

          {/* Results */}
          {searched && (
            <div className="space-y-2 pb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-light-secondary-text dark:text-dark-secondary-text">
                Results ({results.length})
              </p>
              {results.length === 0 ? (
                <p className="text-sm text-light-secondary-text dark:text-dark-secondary-text py-4 text-center">
                  No results found
                </p>
              ) : (
                results.map((item) => (
                  <button
                    key={`${item.id}-${item.mediaType}`}
                    onClick={() => {
                      onAdd(item);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-light-card dark:hover:bg-dark-card transition text-left group"
                  >
                    <div className="relative w-9 h-14 rounded-lg overflow-hidden shrink-0 bg-light-border dark:bg-dark-border">
                      {item.poster_path && (
                        <TmdbImage
                          src={tmdbImage(item.poster_path, "w92")!}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-light-text dark:text-dark-text truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text capitalize">
                        {item.mediaType}
                      </p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shrink-0">
                      <FontAwesomeIcon
                        icon={faPlus}
                        className="h-3 w-3 text-light-accent dark:text-dark-accent"
                      />
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <style>{`
          .dual-thumb::-webkit-slider-thumb {
            -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
            background: #7c3aed; border: 2.5px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25); pointer-events: all; cursor: pointer;
          }
          .dual-thumb::-moz-range-thumb {
            width: 18px; height: 18px; border-radius: 50%;
            background: #7c3aed; border: 2.5px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25); pointer-events: all; cursor: pointer;
          }
        `}</style>
      </div>
    </>
  );
}
