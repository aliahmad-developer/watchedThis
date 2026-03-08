"use client";

export const dynamic = "force-dynamic";
import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faFilm, faTv, faStar, faCalendar, faTag } from "@fortawesome/free-solid-svg-icons";

interface Filters {
  mediaType: "movie" | "tv";
  genres: number[];
  yearRange: [number, number];
  ratingRange: [number, number];
  keyword: string;
  minSeasons: string; maxSeasons: string;
  minEpisodes: string; maxEpisodes: string;
  sortBy: string;
}

const MOVIE_GENRES: Record<string, number> = {
  Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80,
  Documentary: 99, Drama: 18, Family: 10751, Fantasy: 14, History: 36,
  Horror: 27, Music: 10402, Mystery: 9648, Romance: 10749,
  "Science Fiction": 878, Thriller: 53, War: 10752, Western: 37,
};
const TV_GENRES: Record<string, number> = {
  "Action & Adventure": 10759, Animation: 16, Comedy: 35, Crime: 80,
  Documentary: 99, Drama: 18, Family: 10751, Kids: 10762, Mystery: 9648,
  Reality: 10764, "Sci-Fi & Fantasy": 10765, Western: 37,
};
const SORT_OPTIONS = [
  { label: "Most Popular",  value: "popularity.desc" },
  { label: "Top Rated",     value: "vote_average.desc" },
  { label: "Newest First",  value: "primary_release_date.desc" },
  { label: "Oldest First",  value: "primary_release_date.asc" },
];

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1950;

function parseFiltersFromURL(params: URLSearchParams): Filters {
  return {
    mediaType:   (params.get("mediaType") as "movie" | "tv") || "movie",
    genres:      params.get("genres") ? params.get("genres")!.split(",").map(Number) : [],
    yearRange:   [Number(params.get("minYear") || MIN_YEAR), Number(params.get("maxYear") || CURRENT_YEAR)],
    ratingRange: [Number(params.get("minRating") || 0), Number(params.get("maxRating") || 10)],
    keyword:     params.get("keyword") || "",
    minSeasons:  params.get("minSeasons") || "", maxSeasons: params.get("maxSeasons") || "",
    minEpisodes: params.get("minEpisodes") || "", maxEpisodes: params.get("maxEpisodes") || "",
    sortBy:      params.get("sortBy") || "popularity.desc",
  };
}

function filtersToParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams({
    mediaType: f.mediaType, sortBy: f.sortBy,
    minYear: String(f.yearRange[0]), maxYear: String(f.yearRange[1]),
    minRating: String(f.ratingRange[0]), maxRating: String(f.ratingRange[1]),
  });
  if (f.genres.length)  p.set("genres",  f.genres.join(","));
  if (f.keyword.trim()) p.set("keyword", f.keyword.trim());
  if (f.mediaType === "tv") {
    if (f.minSeasons)  p.set("minSeasons",  f.minSeasons);
    if (f.maxSeasons)  p.set("maxSeasons",  f.maxSeasons);
    if (f.minEpisodes) p.set("minEpisodes", f.minEpisodes);
    if (f.maxEpisodes) p.set("maxEpisodes", f.maxEpisodes);
  }
  return p;
}

function DualRangeSlider({ min, max, step = 1, value, onChange, formatLabel }: {
  min: number; max: number; step?: number; value: [number, number];
  onChange: (v: [number, number]) => void; formatLabel?: (v: number) => string;
}) {
  const [low, high] = value;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const fmt = formatLabel ?? String;
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-xs font-semibold">
        <span>{fmt(low)}</span><span>{fmt(high)}</span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute w-full h-1.5 rounded-full bg-light-border dark:bg-dark-border" />
        <div className="absolute h-1.5 rounded-full bg-light-accent dark:bg-dark-accent"
          style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }} />
        <input type="range" min={min} max={max} step={step} value={low}
          onChange={e => onChange([Math.min(Number(e.target.value), high - step), high])}
          className="dual-thumb absolute w-full appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: low > max - (max - min) * 0.1 ? 5 : 3 }} />
        <input type="range" min={min} max={max} step={step} value={high}
          onChange={e => onChange([low, Math.max(Number(e.target.value), low + step)])}
          className="dual-thumb absolute w-full appearance-none bg-transparent pointer-events-none"
          style={{ zIndex: 4 }} />
      </div>
    </div>
  );
}

function SectionLabel({ icon, children }: { icon?: typeof faStar; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-light-secondary-text dark:text-dark-secondary-text mb-2">
      {icon && <FontAwesomeIcon icon={icon} className="h-3 text-light-accent dark:text-dark-accent" />}
      {children}
    </p>
  );
}

export default function FindPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill from URL so filters are restored when user hits back from results
  const [filters, setFilters] = useState<Filters>(() => parseFiltersFromURL(searchParams));

  const toggleGenre = (id: number) =>
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(id) ? prev.genres.filter(g => g !== id) : [...prev.genres, id],
    }));

  // Navigate to a completely separate results page
  const handleSearch = useCallback(() => {
    router.push(`/find/results?${filtersToParams(filters).toString()}`);
  }, [filters, router]);

  const genres = filters.mediaType === "movie" ? MOVIE_GENRES : TV_GENRES;

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-7">
        <h1 className="text-xl sm:text-2xl font-bold">Find Media</h1>

        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 sm:p-6 space-y-6">

          {/* Keyword */}
          <div>
            <SectionLabel icon={faTag}>Keyword</SectionLabel>
            <div className="relative">
              <input type="text" placeholder="e.g. heist, space, vampire..."
                value={filters.keyword}
                onChange={e => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent" />
              <FontAwesomeIcon icon={faSearch} className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 text-light-secondary-text dark:text-dark-secondary-text pointer-events-none" />
            </div>
          </div>

          {/* Type */}
          <div>
            <SectionLabel icon={faFilm}>Type</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {(["movie", "tv"] as const).map(type => (
                <button key={type}
                  onClick={() => setFilters(prev => ({ ...prev, mediaType: type, genres: [] }))}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    filters.mediaType === type
                      ? "bg-light-accent dark:bg-dark-accent text-white border-transparent shadow-md"
                      : "bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border text-light-secondary-text dark:text-dark-secondary-text hover:border-light-accent dark:hover:border-dark-accent"
                  }`}>
                  <FontAwesomeIcon icon={type === "movie" ? faFilm : faTv} className="h-3.5" />
                  {type === "movie" ? "Movies" : "TV Shows"}
                </button>
              ))}
            </div>
          </div>

          {/* Genres */}
          <div>
            <SectionLabel>Genres</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {Object.entries(genres).map(([name, id]) => (
                <button key={id} onClick={() => toggleGenre(id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    filters.genres.includes(id)
                      ? "bg-light-accent dark:bg-dark-accent text-white border-transparent scale-105"
                      : "bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border text-light-secondary-text dark:text-dark-secondary-text hover:border-light-accent dark:hover:border-dark-accent"
                  }`}>
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Year + Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <SectionLabel icon={faCalendar}>Release Year</SectionLabel>
              <DualRangeSlider min={MIN_YEAR} max={CURRENT_YEAR} value={filters.yearRange}
                onChange={v => setFilters(prev => ({ ...prev, yearRange: v }))} />
            </div>
            <div>
              <SectionLabel icon={faStar}>Rating</SectionLabel>
              <DualRangeSlider min={0} max={10} step={0.5} value={filters.ratingRange}
                onChange={v => setFilters(prev => ({ ...prev, ratingRange: v }))}
                formatLabel={v => `${v}★`} />
            </div>
          </div>

          {/* TV only */}
          {filters.mediaType === "tv" && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Seasons",  minKey: "minSeasons",  maxKey: "maxSeasons"  },
                { label: "Episodes", minKey: "minEpisodes", maxKey: "maxEpisodes" },
              ].map(({ label, minKey, maxKey }) => (
                <div key={label}>
                  <SectionLabel>{label}</SectionLabel>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Min" min={1}
                      value={filters[minKey as keyof Filters] as string}
                      onChange={e => setFilters(prev => ({ ...prev, [minKey]: e.target.value }))}
                      className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm" />
                    <input type="number" placeholder="Max" min={1}
                      value={filters[maxKey as keyof Filters] as string}
                      onChange={e => setFilters(prev => ({ ...prev, [maxKey]: e.target.value }))}
                      className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sort + Search */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <select value={filters.sortBy}
              onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full sm:flex-1 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border hover:bg-light-card dark:hover:bg-dark-card rounded-xl px-3 py-2.5 text-sm">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={handleSearch}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl bg-light-accent dark:bg-dark-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity">
              <FontAwesomeIcon icon={faSearch} className="h-3.5" />
              Search
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .dual-thumb::-webkit-slider-thumb {
          -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%;
          background: var(--color-light-card, #7c3aed); border: 2.5px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25); pointer-events: all; cursor: pointer; transition: transform 0.15s;
        }
        .dual-thumb::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .dual-thumb::-moz-range-thumb {
          width: 20px; height: 20px; border-radius: 50%;
          background: var(--color-light-card, #7c3aed); border: 2.5px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25); pointer-events: all; cursor: pointer;
        }
      `}</style>
    </div>
  );
}