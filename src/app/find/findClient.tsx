"use client";

export const dynamic = "force-dynamic";
import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faFilm,
  faTv,
  faStar,
  faCalendar,
  faTag,
  faBan,
  faToggleOn,
  faToggleOff,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  DualRangeSlider,
  SectionLabel,
  GenreChip,
  SliderStyles,
  type GenreState,
} from "../components/filter/component";
import { trackFindFilters } from "../components/Recommendation/behaviourTracker";

interface Filters {
  mediaType: "movie" | "tv";
  genres: number[];
  excludeGenres: number[];
  excludeKeywords: string[];
  yearRange: [number, number];
  ratingRange: [number, number];
  keywords: string[];
  minSeasons: string;
  maxSeasons: string;
  minEpisodes: string;
  maxEpisodes: string;
  sortBy: string;
  strictMode: boolean;
}

const MOVIE_GENRES: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  "Science Fiction": 878,
  Thriller: 53,
  War: 10752,
  Western: 37,
};
const TV_GENRES: Record<string, number> = {
  "Action & Adventure": 10759,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Kids: 10762,
  Mystery: 9648,
  Reality: 10764,
  "Sci-Fi & Fantasy": 10765,
  Western: 37,
};
const SORT_OPTIONS = [
  { label: "Most Popular", value: "popularity.desc" },
  { label: "Top Rated", value: "vote_average.desc" },
  { label: "Newest First", value: "primary_release_date.desc" },
  { label: "Oldest First", value: "primary_release_date.asc" },
];

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1950;

const DEFAULT_FILTERS: Filters = {
  mediaType: "movie",
  genres: [],
  excludeGenres: [],
  excludeKeywords: [],
  yearRange: [MIN_YEAR, CURRENT_YEAR],
  ratingRange: [0, 10],
  keywords: [],
  minSeasons: "",
  maxSeasons: "",
  minEpisodes: "",
  maxEpisodes: "",
  sortBy: "popularity.desc",
  strictMode: false,
};

function parseFiltersFromURL(params: URLSearchParams): Filters {
  return {
    mediaType: (params.get("mediaType") as "movie" | "tv") || "movie",
    genres: params.get("genres")
      ? params.get("genres")!.split(",").map(Number)
      : [],
    excludeGenres: params.get("excludeGenres")
      ? params.get("excludeGenres")!.split(",").map(Number)
      : [],
    excludeKeywords: params.get("excludeKeywords")
      ? params.get("excludeKeywords")!.split(",")
      : [],
    yearRange: [
      Number(params.get("minYear") || MIN_YEAR),
      Number(params.get("maxYear") || CURRENT_YEAR),
    ],
    ratingRange: [
      Number(params.get("minRating") || 0),
      Number(params.get("maxRating") || 10),
    ],
    keywords: params.get("keywords") ? params.get("keywords")!.split(",") : [],
    minSeasons: params.get("minSeasons") || "",
    maxSeasons: params.get("maxSeasons") || "",
    minEpisodes: params.get("minEpisodes") || "",
    maxEpisodes: params.get("maxEpisodes") || "",
    sortBy: params.get("sortBy") || "popularity.desc",
    strictMode: params.get("strict") === "true",
  };
}

function filtersToParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams({
    mediaType: f.mediaType,
    sortBy: f.sortBy,
    minYear: String(f.yearRange[0]),
    maxYear: String(f.yearRange[1]),
    minRating: String(f.ratingRange[0]),
    maxRating: String(f.ratingRange[1]),
  });
  if (f.genres.length) p.set("genres", f.genres.join(","));
  if (f.excludeGenres.length) p.set("excludeGenres", f.excludeGenres.join(","));
  if (f.excludeKeywords.length)
    p.set("excludeKeywords", f.excludeKeywords.join(","));
  if (f.keywords.length) p.set("keywords", f.keywords.join(","));
  if (f.strictMode) p.set("strict", "true");
  if (f.mediaType === "tv") {
    if (f.minSeasons) p.set("minSeasons", f.minSeasons);
    if (f.maxSeasons) p.set("maxSeasons", f.maxSeasons);
    if (f.minEpisodes) p.set("minEpisodes", f.minEpisodes);
    if (f.maxEpisodes) p.set("maxEpisodes", f.maxEpisodes);
  }
  return p;
}

/* ─── Skeleton ──────────────────────────────────────────────────────────── */
export function FindPageSkeleton() {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-7">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-4 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 sm:p-6 space-y-6">
          {/* strict mode */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border">
            <div className="space-y-1.5">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse ml-4 shrink-0" />
          </div>

          {/* keyword */}
          <div className="space-y-2">
            <div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          </div>

          {/* type */}
          <div className="space-y-2">
            <div className="h-3.5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* genres */}
          <div className="space-y-2">
            <div className="h-3.5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-3 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                80, 64, 96, 72, 56, 88, 72, 64, 80, 96, 56, 72, 88, 64, 72, 80,
              ].map((w, i) => (
                <div
                  key={i}
                  style={{ width: w }}
                  className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {["Release Year", "Rating"].map((label) => (
              <div key={label} className="space-y-3">
                <div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="flex justify-between">
                  <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              </div>
            ))}
          </div>

          {/* blacklist */}
          <div className="space-y-2">
            <div className="h-3.5 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-3 w-72 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              <div className="h-9 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* sort + search */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            <div className="h-10 w-full sm:w-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Inner page (needs useSearchParams) ────────────────────────────────── */
function FindPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() =>
    parseFiltersFromURL(searchParams),
  );
  const [kwInput, setKwInput] = useState("");
  const [kwIncludeInput, setKwIncludeInput] = useState("");

  const genres = filters.mediaType === "movie" ? MOVIE_GENRES : TV_GENRES;
  const hasExclusions =
    filters.excludeGenres.length > 0 || filters.excludeKeywords.length > 0;

  const genreState = (id: number): GenreState => {
    if (filters.genres.includes(id)) return "include";
    if (filters.excludeGenres.includes(id)) return "exclude";
    return "neutral";
  };

  const cycleGenre = (id: number) => {
    const current = genreState(id);
    setFilters((prev) => {
      const g = prev.genres.filter((x) => x !== id);
      const eg = prev.excludeGenres.filter((x) => x !== id);
      if (current === "neutral")
        return { ...prev, genres: [...g, id], excludeGenres: eg };
      if (current === "include")
        return { ...prev, genres: g, excludeGenres: [...eg, id] };
      return { ...prev, genres: g, excludeGenres: eg };
    });
  };

  const addKeyword = () => {
    const kw = kwInput.trim().toLowerCase();
    if (!kw || filters.excludeKeywords.includes(kw)) {
      setKwInput("");
      return;
    }
    setFilters((prev) => ({
      ...prev,
      excludeKeywords: [...prev.excludeKeywords, kw],
    }));
    setKwInput("");
  };
  const removeKeyword = (kw: string) =>
    setFilters((prev) => ({
      ...prev,
      excludeKeywords: prev.excludeKeywords.filter((k) => k !== kw),
    }));

  const handleSearch = useCallback(() => {
    // Fire-and-forget — never blocks navigation
    trackFindFilters({
      mediaType: filters.mediaType,
      genres: filters.genres,
      excludeGenres: filters.excludeGenres,
      keywords: filters.keywords,
      excludeKeywords: filters.excludeKeywords,
      yearRange: filters.yearRange,
      ratingRange: filters.ratingRange,
      sortBy: filters.sortBy,
    });

    router.push(`/find/results?${filtersToParams(filters).toString()}`);
  }, [filters, router]);

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-1 ">
            <FontAwesomeIcon
              icon={faSearch}
              className="text-light-accent dark:text-dark-accent ml-1"
              style={{ width: "1.5rem", height: "1.5rem" }}
            />
            <h2>Find Movies and Tv shows.</h2>
          </div>

          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
           className="bg-transparent text-xs text-light-secondary-text dark:text-dark-secondary-text hover:text-light-body-text dark:hover:text-dark-body-text transition underline underline-offset-2"
          >
            Reset
          </button>
        </div>

        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 sm:p-6 space-y-6">
          {/* Strict Mode */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border">
            <div>
              <p className="text-sm font-semibold text-light-body-text dark:text-dark-body-text">
                Strict Mode
              </p>
              <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text mt-0.5">
                {filters.strictMode
                  ? "All selected filters apply together (AND)"
                  : "Any matching filter counts (OR)"}
              </p>
            </div>
            <button
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  strictMode: !prev.strictMode,
                }))
              }
              className="text-2xl transition-colors ml-4 shrink-0 bg-transparent hover:bg-light-secondary-text/20 dark:hover:bg-dark-secondary-text/20 p-1 rounded-full"
            >
              <FontAwesomeIcon
                icon={filters.strictMode ? faToggleOn : faToggleOff}
                className={
                  filters.strictMode
                    ? "text-light-accent dark:text-dark-accent"
                    : "text-light-secondary-text dark:text-dark-secondary-text"
                }
              />
            </button>
          </div>

          {/* Include Keywords */}
          <div>
            <SectionLabel icon={faTag}>Keywords</SectionLabel>
            <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text mb-2 -mt-1">
              Include media matching these words in title, description, or tags.
            </p>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. heist, space, vampire..."
                  value={kwIncludeInput}
                  onChange={(e) => setKwIncludeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const kw = kwIncludeInput.trim().toLowerCase();
                      if (!kw || filters.keywords.includes(kw)) {
                        setKwIncludeInput("");
                        return;
                      }
                      setFilters((prev) => ({
                        ...prev,
                        keywords: [...prev.keywords, kw],
                      }));
                      setKwIncludeInput("");
                    }
                  }}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent"
                />
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 text-light-secondary-text dark:text-dark-secondary-text pointer-events-none"
                />
              </div>
              <button
                onClick={() => {
                  const kw = kwIncludeInput.trim().toLowerCase();
                  if (!kw || filters.keywords.includes(kw)) {
                    setKwIncludeInput("");
                    return;
                  }
                  setFilters((prev) => ({
                    ...prev,
                    keywords: [...prev.keywords, kw],
                  }));
                  setKwIncludeInput("");
                }}
                className="px-3 py-2 rounded-xl bg-light-accent dark:bg-dark-accent text-white text-sm font-semibold transition hover:opacity-90"
              >
                <FontAwesomeIcon icon={faPlus} className="h-3.5" />
              </button>
            </div>
            {filters.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                {filters.keywords.map((kw) => (
                  <button
                    key={kw}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        keywords: prev.keywords.filter((k) => k !== kw),
                      }))
                    }
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-light-accent/10 dark:bg-dark-accent/10 border border-light-accent/25 dark:border-dark-accent/25 text-light-accent dark:text-dark-accent hover:bg-light-accent/20 dark:hover:bg-dark-accent/20 transition"
                  >
                    {kw} ×
                  </button>
                ))}
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, keywords: [] }))
                  }
                 className="bg-transparent text-xs text-light-secondary-text dark:text-dark-secondary-text hover:text-light-body-text dark:hover:text-dark-body-text transition underline underline-offset-2"
                >
                  clear all
                </button>
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <SectionLabel icon={faFilm}>Type</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {(["movie", "tv"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      mediaType: type,
                      genres: [],
                      excludeGenres: [],
                    }))
                  }
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    filters.mediaType === type
                      ? "bg-light-accent dark:bg-dark-accent text-white border-transparent shadow-md"
                      : "bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border text-light-secondary-text dark:text-dark-secondary-text hover:border-light-accent dark:hover:border-dark-accent"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={type === "movie" ? faFilm : faTv}
                    className="h-3.5"
                  />
                  {type === "movie" ? "Movies" : "TV Shows"}
                </button>
              ))}
            </div>
          </div>

          {/* Genres */}
          <div>
            <SectionLabel icon={faTag}>Genres</SectionLabel>
            <p className="inline text-xs text-light-secondary-text dark:text-dark-secondary-text mb-2 -mt-1 leading-snug">
              Tap once to{" "}
              <span className="inline text-light-accent dark:text-dark-accent font-semibold">
                include
              </span>
              {", "}
              twice to{" "}
              <span className="inline text-red-400 font-semibold">exclude</span>
              {", "}again to clear.
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(genres).map(([name, id]) => (
                <GenreChip
                  key={id}
                  name={name}
                  state={genreState(id)}
                  onClick={() => cycleGenre(id)}
                />
              ))}
            </div>
          </div>

          {/* Year + Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <SectionLabel icon={faCalendar}>Release Year</SectionLabel>
              <DualRangeSlider
                min={MIN_YEAR}
                max={CURRENT_YEAR}
                value={filters.yearRange}
                onChange={(v) =>
                  setFilters((prev) => ({ ...prev, yearRange: v }))
                }
              />
            </div>
            <div>
              <SectionLabel icon={faStar}>Rating</SectionLabel>
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
          </div>

          {/* TV only */}
          {filters.mediaType === "tv" && (
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Seasons",
                  minKey: "minSeasons",
                  maxKey: "maxSeasons",
                },
                {
                  label: "Episodes",
                  minKey: "minEpisodes",
                  maxKey: "maxEpisodes",
                },
              ].map(({ label, minKey, maxKey }) => (
                <div key={label}>
                  <SectionLabel>{label}</SectionLabel>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      min={1}
                      value={filters[minKey as keyof Filters] as string}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          [minKey]: e.target.value,
                        }))
                      }
                      className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      min={1}
                      value={filters[maxKey as keyof Filters] as string}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          [maxKey]: e.target.value,
                        }))
                      }
                      className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Blacklist Keywords */}
          <div>
            <SectionLabel icon={faBan}>Blacklist Keywords</SectionLabel>
            <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text mb-2 -mt-1">
              Exclude media containing these words in title, description, or
              tags.
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="e.g. violence, war, zombies…"
                value={kwInput}
                onChange={(e) => setKwInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                className="flex-1 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent"
              />
              <button
                onClick={addKeyword}
                className="px-3 py-2 rounded-xl bg-light-accent dark:bg-dark-accent text-white text-sm font-semibold transition hover:opacity-90"
              >
                <FontAwesomeIcon icon={faPlus} className="h-3.5" />
              </button>
            </div>
            {hasExclusions ? (
              <div className="flex flex-wrap gap-1.5 items-center">
                {filters.excludeGenres.map((id) => {
                  const name = Object.entries(genres).find(
                    ([, gid]) => gid === id,
                  )?.[0];
                  if (!name) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => cycleGenre(id)}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/25 transition"
                    >
                      {name}
                    </button>
                  );
                })}
                {filters.excludeKeywords.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => removeKeyword(kw)}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/25 transition"
                  >
                    {kw}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      excludeGenres: [],
                      excludeKeywords: [],
                    }))
                  }
                  className="bg-transparent text-xs text-light-secondary-text dark:text-dark-secondary-text hover:text-light-body-text dark:hover:text-dark-body-text transition underline underline-offset-2"
                >
                  clear all
                </button>
              </div>
            ) : (
              <p className="text-xs text-light-secondary-text/50 dark:text-dark-secondary-text/50 italic">
                No exclusions yet.
              </p>
            )}
          </div>

          {/* Sort + Search */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, sortBy: e.target.value }))
              }
              className="w-full sm:flex-1 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border hover:bg-light-card dark:hover:bg-dark-card rounded-xl px-3 py-2.5 text-sm"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl bg-light-accent dark:bg-dark-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <FontAwesomeIcon icon={faSearch} className="h-3.5" />
              Search
            </button>
          </div>
        </div>
      </div>

      <SliderStyles />
    </div>
  );
}

/* ─── Export: wrap in Suspense so useSearchParams doesn't block ─────────── */
export default function FindPage() {
  return (
    <Suspense fallback={<FindPageSkeleton />}>
      <FindPageInner />
    </Suspense>
  );
}
