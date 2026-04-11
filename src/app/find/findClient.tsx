"use client";
export const dynamic = "force-dynamic";
import {
  useState,
  useCallback,
  useMemo,
  Suspense,
  useEffect,
  memo,
  useRef,
} from "react";
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
  faXmark,
  faGlobe,
  faClock,
  faHashtag,
  faSliders,
} from "@fortawesome/free-solid-svg-icons";
import {
  DualRangeSlider,
  SectionLabel,
  GenreChip,
  SliderStyles,
  type GenreState,
} from "../components/filter/component";
import { trackFindFilters } from "../components/Recommendation/behaviourTracker";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Filters {
  mediaType: ("movie" | "tv")[];
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
  tvStatus: string[];
  networks: number[];
  runtimeRange: [number, number];
  language: string;
  minVotes: string;
  sortBy: string;
  strictMode: boolean;
}

/* ─── Genre lists ────────────────────────────────────────────────────────── */
const MOVIE_GENRES: Record<string, number> = {
  Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80,
  Documentary: 99, Drama: 18, Family: 10751, Fantasy: 14, History: 36,
  Horror: 27, Music: 10402, Mystery: 9648, Romance: 10749,
  "Science Fiction": 878, Thriller: 53, "TV Movie": 10770, War: 10752, Western: 37,
};

const TV_GENRES: Record<string, number> = {
  "Action & Adventure": 10759, Animation: 16, Comedy: 35, Crime: 80,
  Documentary: 99, Drama: 18, Family: 10751, Kids: 10762, Mystery: 9648,
  News: 10763, Reality: 10764, "Sci-Fi & Fantasy": 10765, Soap: 10766,
  Talk: 10767, "War & Politics": 10768, Western: 37,
};

const SORT_OPTIONS = [
  { label: "Most Popular", value: "popularity.desc" },
  { label: "Top Rated", value: "vote_average.desc" },
  { label: "Newest First", value: "primary_release_date.desc" },
  { label: "Oldest First", value: "primary_release_date.asc" },
  { label: "Most Voted", value: "vote_count.desc" },
  { label: "Revenue (High→Low)", value: "revenue.desc" },
];

const LANGUAGES: { code: string; label: string }[] = [
  { code: "", label: "Any Language" }, { code: "en", label: "English" },
  { code: "ko", label: "Korean" }, { code: "ja", label: "Japanese" },
  { code: "es", label: "Spanish" }, { code: "fr", label: "French" },
  { code: "de", label: "German" }, { code: "hi", label: "Hindi" },
  { code: "zh", label: "Chinese" }, { code: "pt", label: "Portuguese" },
  { code: "it", label: "Italian" }, { code: "tr", label: "Turkish" },
  { code: "th", label: "Thai" }, { code: "da", label: "Danish" },
  { code: "sv", label: "Swedish" }, { code: "no", label: "Norwegian" },
  { code: "ar", label: "Arabic" }, { code: "ru", label: "Russian" },
];

const NETWORKS: { id: number; label: string }[] = [
  { id: 213, label: "Netflix" }, { id: 1024, label: "Amazon" },
  { id: 2552, label: "Apple TV+" }, { id: 49, label: "HBO" },
  { id: 2739, label: "Disney+" }, { id: 453, label: "Hulu" },
  { id: 174, label: "AMC" }, { id: 19, label: "Fox" },
  { id: 6, label: "NBC" }, { id: 2, label: "ABC" },
  { id: 16, label: "CBS" }, { id: 56, label: "BBC" },
  { id: 4353, label: "Peacock" }, { id: 1436, label: "Paramount+" },
];

const TV_STATUSES = [
  { value: "0", label: "In Production" }, { value: "2", label: "Planned" },
  { value: "1", label: "Returning" }, { value: "4", label: "Ended" },
  { value: "3", label: "Cancelled" },
];

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1900;
const MIN_RUNTIME = 0;
const MAX_RUNTIME = 240;

const DEFAULT_FILTERS: Filters = {
  mediaType: ["movie", "tv"], genres: [], excludeGenres: [],
  excludeKeywords: [], yearRange: [MIN_YEAR, CURRENT_YEAR],
  ratingRange: [0, 10], keywords: [], minSeasons: "", maxSeasons: "",
  minEpisodes: "", maxEpisodes: "", tvStatus: [], networks: [],
  runtimeRange: [MIN_RUNTIME, MAX_RUNTIME], language: "", minVotes: "",
  sortBy: "popularity.desc", strictMode: false,
};

/* ─── URL helpers ───────────────────────────────────────────────────────── */
function parseFiltersFromURL(params: URLSearchParams): Filters {
  return {
    mediaType: params.get("mediaType")
      ? (params.get("mediaType")!.split(",") as ("movie" | "tv")[])
      : ["movie", "tv"],
    genres: params.get("genres") ? params.get("genres")!.split(",").map(Number) : [],
    excludeGenres: params.get("excludeGenres") ? params.get("excludeGenres")!.split(",").map(Number) : [],
    excludeKeywords: params.get("excludeKeywords") ? params.get("excludeKeywords")!.split(",") : [],
    yearRange: [Number(params.get("minYear") || MIN_YEAR), Number(params.get("maxYear") || CURRENT_YEAR)],
    ratingRange: [Number(params.get("minRating") || 0), Number(params.get("maxRating") || 10)],
    keywords: params.get("keywords") ? params.get("keywords")!.split(",") : [],
    minSeasons: params.get("minSeasons") || "", maxSeasons: params.get("maxSeasons") || "",
    minEpisodes: params.get("minEpisodes") || "", maxEpisodes: params.get("maxEpisodes") || "",
    tvStatus: params.get("tvStatus") ? params.get("tvStatus")!.split(",") : [],
    networks: params.get("networks") ? params.get("networks")!.split(",").map(Number) : [],
    runtimeRange: [Number(params.get("minRuntime") || MIN_RUNTIME), Number(params.get("maxRuntime") || MAX_RUNTIME)],
    language: params.get("language") || "", minVotes: params.get("minVotes") || "",
    sortBy: params.get("sortBy") || "popularity.desc", strictMode: params.get("strict") === "true",
  };
}

function filtersToParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams({
    mediaType: f.mediaType.join(","), sortBy: f.sortBy,
    minYear: String(f.yearRange[0]), maxYear: String(f.yearRange[1]),
    minRating: String(f.ratingRange[0]), maxRating: String(f.ratingRange[1]),
  });
  if (f.genres.length) p.set("genres", f.genres.join(","));
  if (f.excludeGenres.length) p.set("excludeGenres", f.excludeGenres.join(","));
  if (f.excludeKeywords.length) p.set("excludeKeywords", f.excludeKeywords.join(","));
  if (f.keywords.length) p.set("keywords", f.keywords.join(","));
  if (f.strictMode) p.set("strict", "true");
  if (f.language) p.set("language", f.language);
  if (f.minVotes) p.set("minVotes", f.minVotes);
  if (f.networks.length) p.set("networks", f.networks.join(","));
  if (f.runtimeRange[0] !== MIN_RUNTIME) p.set("minRuntime", String(f.runtimeRange[0]));
  if (f.runtimeRange[1] !== MAX_RUNTIME) p.set("maxRuntime", String(f.runtimeRange[1]));
  if (f.mediaType.includes("tv")) {
    if (f.minSeasons) p.set("minSeasons", f.minSeasons);
    if (f.maxSeasons) p.set("maxSeasons", f.maxSeasons);
    if (f.minEpisodes) p.set("minEpisodes", f.minEpisodes);
    if (f.maxEpisodes) p.set("maxEpisodes", f.maxEpisodes);
    if (f.tvStatus.length) p.set("tvStatus", f.tvStatus.join(","));
  }
  return p;
}

function countActiveFilters(f: Filters): number {
  let n = 0;
  if (f.genres.length || f.excludeGenres.length) n++;
  if (f.keywords.length) n++;
  if (f.excludeKeywords.length) n++;
  if (f.yearRange[0] !== MIN_YEAR || f.yearRange[1] !== CURRENT_YEAR) n++;
  if (f.ratingRange[0] !== 0 || f.ratingRange[1] !== 10) n++;
  if (f.strictMode) n++;
  if (f.minSeasons || f.maxSeasons || f.minEpisodes || f.maxEpisodes) n++;
  if (f.tvStatus.length) n++;
  if (f.networks.length) n++;
  if (f.runtimeRange[0] !== MIN_RUNTIME || f.runtimeRange[1] !== MAX_RUNTIME) n++;
  if (f.language) n++;
  if (f.minVotes) n++;
  return n;
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

const KeywordInput = memo(function KeywordInput({
  placeholder, value, onChange, onAdd,
}: {
  placeholder: string; value: string;
  onChange: (v: string) => void; onAdd: () => void;
}) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border
            rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2
            focus:ring-light-accent dark:focus:ring-dark-accent transition-all duration-200
            placeholder:text-light-secondary-text/50 dark:placeholder:text-dark-secondary-text/50"
        />
        <FontAwesomeIcon
          icon={faSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5
            text-light-secondary-text dark:text-dark-secondary-text pointer-events-none opacity-50"
        />
      </div>
      <button
        onClick={onAdd}
        aria-label="Add keyword"
        className="px-3.5 py-2 rounded-xl bg-light-accent dark:bg-dark-accent text-white text-sm
          font-semibold transition-all duration-200 hover:opacity-90 active:scale-95
          hover:shadow-md hover:shadow-light-accent/20 dark:hover:shadow-dark-accent/20"
      >
        <FontAwesomeIcon icon={faPlus} className="h-3.5" />
      </button>
    </div>
  );
});

const KeywordChip = memo(function KeywordChip({
  label, onRemove, variant = "include",
}: {
  label: string; onRemove: () => void; variant?: "include" | "exclude";
}) {
  const cls =
    variant === "include"
      ? "bg-light-accent/10 dark:bg-dark-accent/10 border-light-accent/25 dark:border-dark-accent/25 text-light-accent dark:text-dark-accent hover:bg-light-accent/20 dark:hover:bg-dark-accent/20"
      : "bg-red-500/10 border-red-500/25 text-red-400 hover:bg-red-500/20";
  return (
    <button
      onClick={onRemove}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        border transition-all duration-150 active:scale-95 ${cls}`}
    >
      {label}
      <FontAwesomeIcon icon={faXmark} className="h-2.5 opacity-70" />
    </button>
  );
});

const ToggleChip = memo(function ToggleChip({
  label, active, onClick,
}: {
  label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200
        active:scale-[0.97] select-none ${
        active
          ? "bg-light-accent dark:bg-dark-accent text-white border-transparent shadow-sm shadow-light-accent/30 dark:shadow-dark-accent/30"
          : "bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border text-light-secondary-text dark:text-dark-secondary-text hover:border-light-accent dark:hover:border-dark-accent hover:text-light-body-text dark:hover:text-dark-body-text"
      }`}
    >
      {label}
    </button>
  );
});

/* ─── Animated Plus Icon for keyboard shortcut ──────────────────────────── */
function AnimatedPlus() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);
  return (
    <FontAwesomeIcon
      icon={faPlus}
      style={{
        width: "0.55em",
        height: "0.55em",
        display: "inline",
        transform: mounted ? "scale(1)" : "scale(0.3)",
        opacity: mounted ? 1 : 0,
        transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease",
      }}
    />
  );
}

/* ─── Skeleton ──────────────────────────────────────────────────────────── */
export function FindPageSkeleton() {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-5">
        <div className="flex items-center justify-between px-1">
          <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 sm:p-6 space-y-5">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              style={{ opacity: 1 - i * 0.1 }}
              className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Inner page ────────────────────────────────────────────────────────── */
function FindPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() => {
  const urlFilters = parseFiltersFromURL(searchParams);
  const hasUrlParams = searchParams.toString().length > 0;
  if (!hasUrlParams && typeof window !== "undefined") {
    try {
      const saved = sessionStorage.getItem("find-filters");
      if (saved) return JSON.parse(saved) as Filters;
    } catch {}
  }
  return urlFilters;
});

// Re-sync whenever URL params change (manual URL edit, back/forward, results → find navigation)
useEffect(() => {
  const hasUrlParams = searchParams.toString().length > 0;
  if (hasUrlParams) {
    setFilters(parseFiltersFromURL(searchParams));
  } else {
    try {
      const saved = sessionStorage.getItem("find-filters");
      if (saved) {
        setFilters(JSON.parse(saved) as Filters);
        return;
      }
    } catch {}
    setFilters(DEFAULT_FILTERS);
  }
}, [searchParams]);
  const [kwInput, setKwInput] = useState("");
  const [kwIncludeInput, setKwIncludeInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Staggered mount animation
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const genres = useMemo(
    () =>
      filters.mediaType.length === 2
        ? { ...MOVIE_GENRES, ...TV_GENRES }
        : filters.mediaType[0] === "movie"
          ? MOVIE_GENRES
          : TV_GENRES,
    [filters.mediaType],
  );

  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  const genreState = useCallback(
    (id: number): GenreState => {
      if (filters.genres.includes(id)) return "include";
      if (filters.excludeGenres.includes(id)) return "exclude";
      return "neutral";
    },
    [filters.genres, filters.excludeGenres],
  );

  const isTvOnly = filters.mediaType.length === 1 && filters.mediaType[0] === "tv";
  const includesTv = filters.mediaType.includes("tv");
  const includesMovie = filters.mediaType.includes("movie");

  const cycleGenre = useCallback((id: number) => {
    setFilters((prev) => {
      const state = prev.genres.includes(id) ? "include" : prev.excludeGenres.includes(id) ? "exclude" : "neutral";
      const g = prev.genres.filter((x) => x !== id);
      const eg = prev.excludeGenres.filter((x) => x !== id);
      if (state === "neutral") return { ...prev, genres: [...g, id], excludeGenres: eg };
      if (state === "include") return { ...prev, genres: g, excludeGenres: [...eg, id] };
      return { ...prev, genres: g, excludeGenres: eg };
    });
  }, []);

  const toggleMediaType = useCallback((type: "movie" | "tv") => {
    setFilters((prev) => {
      const already = prev.mediaType.includes(type);
      if (already && prev.mediaType.length === 1) return prev;
      return {
        ...prev,
        mediaType: already ? prev.mediaType.filter((t) => t !== type) : [...prev.mediaType, type],
        genres: [], excludeGenres: [],
      };
    });
  }, []);

  const toggleNetwork = useCallback((id: number) => {
    setFilters((prev) => ({
      ...prev,
      networks: prev.networks.includes(id) ? prev.networks.filter((n) => n !== id) : [...prev.networks, id],
    }));
  }, []);

  const toggleTvStatus = useCallback((val: string) => {
    setFilters((prev) => ({
      ...prev,
      tvStatus: prev.tvStatus.includes(val) ? prev.tvStatus.filter((s) => s !== val) : [...prev.tvStatus, val],
    }));
  }, []);

  const addIncludeKeyword = useCallback(() => {
    const kw = kwIncludeInput.trim().toLowerCase();
    if (!kw || filters.keywords.includes(kw)) { setKwIncludeInput(""); return; }
    setFilters((prev) => ({ ...prev, keywords: [...prev.keywords, kw] }));
    setKwIncludeInput("");
  }, [kwIncludeInput, filters.keywords]);

  const removeIncludeKeyword = useCallback((kw: string) => {
    setFilters((prev) => ({ ...prev, keywords: prev.keywords.filter((k) => k !== kw) }));
  }, []);

  const addExcludeKeyword = useCallback(() => {
    const kw = kwInput.trim().toLowerCase();
    if (!kw || filters.excludeKeywords.includes(kw)) { setKwInput(""); return; }
    setFilters((prev) => ({ ...prev, excludeKeywords: [...prev.excludeKeywords, kw] }));
    setKwInput("");
  }, [kwInput, filters.excludeKeywords]);

  const removeExcludeKeyword = useCallback((kw: string) => {
    setFilters((prev) => ({ ...prev, excludeKeywords: prev.excludeKeywords.filter((k) => k !== kw) }));
  }, []);

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    trackFindFilters({
      mediaType: filters.mediaType[0], genres: filters.genres,
      excludeGenres: filters.excludeGenres, keywords: filters.keywords,
      excludeKeywords: filters.excludeKeywords, yearRange: filters.yearRange,
      ratingRange: filters.ratingRange, sortBy: filters.sortBy,
    });
    router.push(`/find/results?${filtersToParams(filters).toString()}`);
  }, [filters, router]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSearch();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSearch]);

  useEffect(() => {
    try { sessionStorage.setItem("find-filters", JSON.stringify(filters)); } catch {}
  }, [filters]);

  const hasExclusions = filters.excludeGenres.length > 0 || filters.excludeKeywords.length > 0;

  /* ── Section animation helper ───────────────────────────────────────── */
  const sectionClass = (delay = 0) =>
    `transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`;

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-5 lg:px-0 py-4 sm:py-8 space-y-4 sm:space-y-6">

        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-1"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(-8px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-light-accent/10 dark:bg-dark-accent/10">
              <FontAwesomeIcon
                icon={faSliders}
                className="text-light-accent dark:text-dark-accent"
                style={{ width: "0.9rem", height: "0.9rem" }}
              />
            </div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              Find Movies &amp; TV Shows
            </h2>
          </div>
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="bg-transparent text-xs text-light-secondary-text dark:text-dark-secondary-text
              hover:text-light-body-text dark:hover:text-dark-body-text transition-colors duration-200
              underline underline-offset-2 px-1 py-0.5"
          >
            Reset all
          </button>
        </div>

        {/* ── Card ── */}
        <div
          className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border
            rounded-2xl shadow-sm overflow-hidden"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.45s ease 0.05s, transform 0.45s ease 0.05s",
          }}
        >
          <div className="p-4 sm:p-6 space-y-6">

            {/* ── Strict Mode ── */}
            <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl
              bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border
              hover:border-light-accent/40 dark:hover:border-dark-accent/40 transition-colors duration-200">
              <div>
                <p className="text-sm font-semibold text-light-body-text dark:text-dark-body-text">
                  Strict Mode
                </p>
                <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text mt-0.5 leading-relaxed">
                  {filters.strictMode ? "All filters must match (AND)" : "Any matching filter counts (OR)"}
                </p>
              </div>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, strictMode: !prev.strictMode }))}
                aria-label="Toggle strict mode"
                className="text-2xl ml-4 shrink-0 bg-transparent hover:opacity-80 transition-all duration-200
                  p-1 rounded-full active:scale-90"
              >
                <FontAwesomeIcon
                  icon={filters.strictMode ? faToggleOn : faToggleOff}
                  className={`transition-colors duration-300 ${
                    filters.strictMode
                      ? "text-light-accent dark:text-dark-accent"
                      : "text-light-secondary-text/50 dark:text-dark-secondary-text/50"
                  }`}
                />
              </button>
            </div>

            {/* ── Media Type ── */}
            <div>
              <SectionLabel icon={faFilm}>Type</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {(["movie", "tv"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleMediaType(type)}
                    className={`flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl border
                      text-sm font-semibold transition-all duration-200 active:scale-[0.98] select-none ${
                      filters.mediaType.includes(type)
                        ? "bg-light-accent dark:bg-dark-accent text-white border-transparent shadow-md shadow-light-accent/20 dark:shadow-dark-accent/20"
                        : "bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border text-light-secondary-text dark:text-dark-secondary-text hover:border-light-accent dark:hover:border-dark-accent hover:text-light-body-text dark:hover:text-dark-body-text"
                    }`}
                  >
                    <FontAwesomeIcon icon={type === "movie" ? faFilm : faTv} className="h-3.5 shrink-0" />
                    <span>{type === "movie" ? "Movies" : "TV Shows"}</span>
                  </button>
                ))}
              </div>
              {filters.mediaType.length === 2 && (
                <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text mt-1.5">
                  Both selected, Searching Movies and TV Shows.
                </p>
              )}
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-light-border dark:border-dark-border -mx-4 sm:-mx-6" />

            {/* ── Keywords (include) ── */}
            <div>
              <SectionLabel icon={faSearch}>Keywords</SectionLabel>
              <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text mb-2.5 -mt-1 leading-relaxed">
                Include media matching these words in title, description, or tags.
              </p>
              <KeywordInput
                placeholder="e.g. heist, space, vampire…"
                value={kwIncludeInput}
                onChange={setKwIncludeInput}
                onAdd={addIncludeKeyword}
              />
              {filters.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center mt-2.5">
                  {filters.keywords.map((kw) => (
                    <KeywordChip key={kw} label={kw} onRemove={() => removeIncludeKeyword(kw)} variant="include" />
                  ))}
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, keywords: [] }))}
                    className="bg-transparent text-xs text-light-secondary-text dark:text-dark-secondary-text
                      hover:text-light-body-text dark:hover:text-dark-body-text transition-colors underline underline-offset-2"
                  >
                    clear all
                  </button>
                </div>
              )}
            </div>

            {/* ── Genres ── */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <SectionLabel icon={faTag}>Genres</SectionLabel>
                {(filters.genres.length > 0 || filters.excludeGenres.length > 0) && (
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, genres: [], excludeGenres: [] }))}
                    className="bg-transparent text-xs text-light-secondary-text dark:text-dark-secondary-text
                      hover:text-light-body-text dark:hover:text-dark-body-text transition-colors underline underline-offset-2"
                  >
                    clear
                  </button>
                )}
              </div>
              <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text mb-3 -mt-1 leading-snug">
                Tap once to{" "}
                <span className="inline text-light-accent dark:text-dark-accent font-semibold">include</span>
                {", "}twice to{" "}
                <span className="inline text-red-400 font-semibold">exclude</span>
                {", "}again to clear.
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(genres).map(([name, id]) => (
                  <GenreChip key={`${name}-${id}`} name={name} state={genreState(id)} onClick={() => cycleGenre(id)} />
                ))}
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-light-border dark:border-dark-border -mx-4 sm:-mx-6" />

            {/* ── Year + Rating ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              <div>
                <SectionLabel icon={faCalendar}>Release Year</SectionLabel>
                <DualRangeSlider
                  min={MIN_YEAR} max={CURRENT_YEAR} value={filters.yearRange}
                  onChange={(v) => setFilters((prev) => ({ ...prev, yearRange: v }))}
                />
              </div>
              <div>
                <SectionLabel icon={faStar}>Rating</SectionLabel>
                <DualRangeSlider
                  min={0} max={10} step={0.5} value={filters.ratingRange}
                  onChange={(v) => setFilters((prev) => ({ ...prev, ratingRange: v }))}
                  formatLabel={(v) => `${v}★`}
                />
              </div>
            </div>

            {/* ── Runtime ── */}
            {!isTvOnly && (
              <div>
                <SectionLabel icon={faClock}>Runtime (minutes)</SectionLabel>
                <DualRangeSlider
                  min={MIN_RUNTIME} max={MAX_RUNTIME} step={5} value={filters.runtimeRange}
                  onChange={(v) => setFilters((prev) => ({ ...prev, runtimeRange: v }))}
                  formatLabel={(v) => (v >= MAX_RUNTIME ? `${v}m+` : `${v}m`)}
                />
              </div>
            )}

            {/* ── Divider ── */}
            <div className="border-t border-light-border dark:border-dark-border -mx-4 sm:-mx-6" />

            {/* ── Language + Min Votes ── */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-4">
              <div>
                <SectionLabel icon={faGlobe}>Language</SectionLabel>
                <select
                  value={filters.language}
                  onChange={(e) => setFilters((prev) => ({ ...prev, language: e.target.value }))}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border
                    rounded-xl px-4 py-2.5 pr-10 text-sm appearance-none cursor-pointer
                    bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23468189%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')]
                    bg-no-repeat bg-[position:right_0.85rem_center] bg-[length:18px_18px]
                    focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent
                    transition-all duration-200 hover:border-light-accent/50 dark:hover:border-dark-accent/50"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <SectionLabel icon={faHashtag}>Min. Vote Count</SectionLabel>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  min={0} step={100}
                  value={filters.minVotes}
                  onChange={(e) => setFilters((prev) => ({ ...prev, minVotes: e.target.value }))}
                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border
                    rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2
                    focus:ring-light-accent dark:focus:ring-dark-accent transition-all duration-200
                    hover:border-light-accent/50 dark:hover:border-dark-accent/50"
                />
                <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text mt-1.5 leading-relaxed">
                  Filters out obscure titles with few ratings.
                </p>
              </div>
            </div>

            {/* ── Networks / Platforms ── */}
            {includesTv && (
              <>
                <div className="border-t border-light-border dark:border-dark-border -mx-4 sm:-mx-6" />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <SectionLabel icon={faTv}>Networks &amp; Platforms</SectionLabel>
                    {filters.networks.length > 0 && (
                      <button
                        onClick={() => setFilters((prev) => ({ ...prev, networks: [] }))}
                        className="bg-transparent text-xs text-light-secondary-text dark:text-dark-secondary-text
                          hover:text-light-body-text dark:hover:text-dark-body-text transition-colors underline underline-offset-2"
                      >
                        clear
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {NETWORKS.map(({ id, label }) => (
                      <ToggleChip key={id} label={label} active={filters.networks.includes(id)} onClick={() => toggleNetwork(id)} />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── TV: Status ── */}
            {includesTv && (
              <div>
                <SectionLabel icon={faTv}>Show Status</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {TV_STATUSES.map(({ value, label }) => (
                    <ToggleChip key={value} label={label} active={filters.tvStatus.includes(value)} onClick={() => toggleTvStatus(value)} />
                  ))}
                </div>
              </div>
            )}

            {/* ── TV: Seasons / Episodes ── */}
            {includesTv && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { label: "Seasons", minKey: "minSeasons", maxKey: "maxSeasons" },
                  { label: "Episodes", minKey: "minEpisodes", maxKey: "maxEpisodes" },
                ].map(({ label, minKey, maxKey }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-light-secondary-text dark:text-dark-secondary-text
                      mb-1.5 uppercase tracking-wide">
                      {label}
                    </p>
                    <div className="flex gap-2">
                      {(["Min", "Max"] as const).map((bound) => {
                        const key = bound === "Min" ? minKey : maxKey;
                        return (
                          <input
                            key={bound}
                            type="number"
                            placeholder={bound}
                            min={1}
                            value={filters[key as keyof Filters] as string}
                            onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))}
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border
                              rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2
                              focus:ring-light-accent dark:focus:ring-dark-accent transition-all duration-200"
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Divider ── */}
            <div className="border-t border-light-border dark:border-dark-border -mx-4 sm:-mx-6" />

            {/* ── Blacklist Keywords ── */}
            <div>
              <SectionLabel icon={faBan}>Blacklist Keywords</SectionLabel>
              <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text mb-2.5 -mt-1 leading-relaxed">
                Exclude media containing these words in title, description, or tags.
              </p>
              <KeywordInput
                placeholder="e.g. violence, war, zombies…"
                value={kwInput}
                onChange={setKwInput}
                onAdd={addExcludeKeyword}
              />
              {hasExclusions ? (
                <div className="flex flex-wrap gap-1.5 items-center mt-2.5">
                  {filters.excludeGenres.map((id) => {
                    const name = Object.entries(genres).find(([, gid]) => gid === id)?.[0];
                    if (!name) return null;
                    return <KeywordChip key={id} label={name} onRemove={() => cycleGenre(id)} variant="exclude" />;
                  })}
                  {filters.excludeKeywords.map((kw) => (
                    <KeywordChip key={kw} label={kw} onRemove={() => removeExcludeKeyword(kw)} variant="exclude" />
                  ))}
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, excludeGenres: [], excludeKeywords: [] }))}
                    className="bg-transparent text-xs text-light-secondary-text dark:text-dark-secondary-text
                      hover:text-light-body-text dark:hover:text-dark-body-text transition-colors underline underline-offset-2"
                  >
                    clear all
                  </button>
                </div>
              ) : (
                <p className="text-xs text-light-secondary-text/40 dark:text-dark-secondary-text/40 italic mt-2">
                  No exclusions yet.
                </p>
              )}
            </div>

            {/* ── Sort + Search ── */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-1">
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                className="w-full sm:flex-1 bg-light-bg dark:bg-dark-bg border border-light-border
                  dark:border-dark-border hover:bg-light-card dark:hover:bg-dark-card
                  rounded-xl px-4 py-2.5 pr-10 text-sm appearance-none cursor-pointer
                  bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23468189%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')]
                  bg-no-repeat bg-[position:right_0.85rem_center] bg-[length:18px_18px]
                  focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent
                  transition-all duration-200"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl
                  bg-light-accent dark:bg-dark-accent text-white font-semibold text-sm
                  hover:opacity-90 active:scale-[0.98] transition-all duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed
                  shadow-md shadow-light-accent/20 dark:shadow-dark-accent/20
                  hover:shadow-lg hover:shadow-light-accent/30 dark:hover:shadow-dark-accent/30"
              >
                <FontAwesomeIcon
                  icon={faSearch}
                  className={`h-3.5 transition-transform duration-700 ${isSearching ? "animate-spin" : ""}`}
                />
                {isSearching ? "Searching…" : "Search"}
              </button>
            </div>

            {/* ── Keyboard shortcut hint ── */}
            <p className="text-center text-[11px] text-light-secondary-text/40 dark:text-dark-secondary-text/40 -mt-2 select-none">
              Press{" "}
              <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]
                border border-light-border dark:border-dark-border font-mono">
                <span className="mt-0">{isMac ? "⌘" : "Ctrl"}</span>
                <AnimatedPlus />
                <span className="mt-0">Enter</span>
              </kbd>{" "}
              to search
            </p>

          </div>
        </div>
      </div>
      <SliderStyles />
    </div>
  );
}

export default function FindPage() {
  return (
    <Suspense fallback={<FindPageSkeleton />}>
      <FindPageInner />
    </Suspense>
  );
}