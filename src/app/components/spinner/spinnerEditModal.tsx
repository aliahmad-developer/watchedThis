"use client";

import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilm, faTv, faStar, faCalendar, faTimes, faTag, faDice, faBan, faToggleOn, faToggleOff, faPlus, faSearch } from "@fortawesome/free-solid-svg-icons";
import { DualRangeSlider, SectionLabel, GenreChip, SliderStyles, type GenreState } from "../../components/filter/component";
import { SpinnerItem } from "./types";

interface Filters {
  mediaType: "movie" | "tv";
  genres: number[];
  excludeGenres: number[];
  excludeKeywords: string[];
  keywords: string[];  // Changed from keyword: string to keywords: string[]
  yearRange: [number, number];
  ratingRange: [number, number];
  sortBy: string;
  strictMode: boolean;
}

const MOVIE_GENRES: Record<string, number> = {
  Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80,
  Drama: 18, Fantasy: 14, Horror: 27, Mystery: 9648, Romance: 10749,
  "Sci-Fi": 878, Thriller: 53,
};
const TV_GENRES: Record<string, number> = {
  "Action & Adventure": 10759, Animation: 16, Comedy: 35, Crime: 80,
  Drama: 18, "Sci-Fi & Fantasy": 10765, Kids: 10762, Mystery: 9648,
  Reality: 10764, Western: 37, Documentary: 99,
};
const SORT_OPTIONS = [
  { label: "Most Popular",  value: "popularity.desc" },
  { label: "Top Rated",     value: "vote_average.desc" },
  { label: "Newest First",  value: "primary_release_date.desc" },
  { label: "Oldest First",  value: "primary_release_date.asc" },
];

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1950;

const DEFAULT_FILTERS: Filters = {
  mediaType: "movie", genres: [], excludeGenres: [], excludeKeywords: [],
  keywords: [],  // Changed from keyword: "" to keywords: []
  yearRange: [MIN_YEAR, CURRENT_YEAR], ratingRange: [0, 10],
  sortBy: "popularity.desc", strictMode: false,
};

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFill: (items: SpinnerItem[]) => void;
  blacklist: SpinnerItem[];
  onUpdateBlacklist: (items: SpinnerItem[]) => void;
  filters?: Filters;
  onSetFilters?: (filters: Filters) => void;
}

interface Filters {
  mediaType: "movie" | "tv";
  genres: number[];
  excludeGenres: number[];
  excludeKeywords: string[];
  keywords: string[];
  yearRange: [number, number];
  ratingRange: [number, number];
  sortBy: string;
  strictMode: boolean;
}

interface TMDBResult {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
}

export default function EditModal({ isOpen, onClose, onFill, blacklist, onUpdateBlacklist, filters: propFilters, onSetFilters }: EditModalProps) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  useEffect(() => {
    if (propFilters) setFilters(propFilters);
  }, [propFilters]);
  const [keywordInput, setKeywordInput] = useState("");
  const [blacklistKeywordInput, setBlacklistKeywordInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const genres = filters.mediaType === "movie" ? MOVIE_GENRES : TV_GENRES;
  const hasKeywords = filters.keywords.length > 0;
  const hasExclusions = filters.excludeGenres.length > 0 || filters.excludeKeywords.length > 0;

  // Genre tri-state
  const genreState = (id: number): GenreState => {
    if (filters.genres.includes(id)) return "include";
    if (filters.excludeGenres.includes(id)) return "exclude";
    return "neutral";
  };

  const cycleGenre = (id: number) => {
    const current = genreState(id);
    setFilters(prev => {
      const g  = prev.genres.filter(x => x !== id);
      const eg = prev.excludeGenres.filter(x => x !== id);
      if (current === "neutral") return { ...prev, genres: [...g, id], excludeGenres: eg };
      if (current === "include") return { ...prev, genres: g, excludeGenres: [...eg, id] };
      return { ...prev, genres: g, excludeGenres: eg };
    });
  };

  // Regular keywords (for inclusion) - multiple allowed
  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (!kw || filters.keywords.includes(kw)) { 
      setKeywordInput(""); 
      return; 
    }
    setFilters(prev => ({ ...prev, keywords: [...prev.keywords, kw] }));
    setKeywordInput("");
  };

  const removeKeyword = (kw: string) =>
    setFilters(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== kw) }));

  // Blacklist keywords - multiple allowed
  const addBlacklistKeyword = () => {
    const kw = blacklistKeywordInput.trim().toLowerCase();
    if (!kw || filters.excludeKeywords.includes(kw)) { 
      setBlacklistKeywordInput(""); 
      return; 
    }
    setFilters(prev => ({ ...prev, excludeKeywords: [...prev.excludeKeywords, kw] }));
    setBlacklistKeywordInput("");
  };
  
  const removeBlacklistKeyword = (kw: string) =>
    setFilters(prev => ({ ...prev, excludeKeywords: prev.excludeKeywords.filter(k => k !== kw) }));

  const handleFill = async () => {
    if (onSetFilters) onSetFilters(filters);
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const isDefaultYear   = filters.yearRange[0] === MIN_YEAR && filters.yearRange[1] === CURRENT_YEAR;
      const isDefaultRating = filters.ratingRange[0] === 0 && filters.ratingRange[1] === 10;

      const params = new URLSearchParams({ mediaType: filters.mediaType, sortBy: filters.sortBy });
      if (filters.strictMode || !isDefaultYear)   { params.set("minYear",   String(filters.yearRange[0]));   params.set("maxYear",   String(filters.yearRange[1])); }
      if (filters.strictMode || !isDefaultRating) { params.set("minRating", String(filters.ratingRange[0])); params.set("maxRating", String(filters.ratingRange[1])); }
      if (filters.genres.length)          params.set("genres",          filters.genres.join(","));
      if (filters.excludeGenres.length)   params.set("excludeGenres",   filters.excludeGenres.join(","));
      if (filters.excludeKeywords.length) params.set("excludeKeywords", filters.excludeKeywords.join(","));
      if (filters.keywords.length)        params.set("keywords",        filters.keywords.join(","));  
      if (filters.strictMode)             params.set("strict",          "true");
      params.set("limit", String(20 + blacklist.length + 10));

      const res  = await fetch(`/api/discover?${params.toString()}`, { signal: abortRef.current.signal });
      const data = await res.json();

      const blacklistIds = new Set(blacklist.map(b => b.id));
      const items: SpinnerItem[] = (data.results || [])
        .filter((r: TMDBResult) => (r.backdrop_path || r.poster_path) && !blacklistIds.has(r.id))
        .slice(0, 20)
        .map((r: TMDBResult) => ({
          id: r.id, mediaType: filters.mediaType,
          title: r.title || r.name || "Untitled",
          poster_path: r.poster_path, backdrop_path: r.backdrop_path,
        }));

      if (items.length === 0) { setError("No results found. Try adjusting your filters."); return; }

      const padded = [...items];
      while (padded.length < 20) padded.push(items[padded.length % items.length]);
      onFill(padded);
      onClose();
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-2xl shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-light-bg dark:bg-dark-bg border-b border-light-border dark:border-dark-border">
            <div>
              <h2 className="font-bold text-lg text-light-text dark:text-dark-text">Spinner Filters</h2>
              <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text mt-0.5">Customize what goes on the wheel</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="bg-transparent text-xs text-light-secondary-text dark:text-dark-secondary-text hover:text-light-text dark:hover:text-dark-text transition underline underline-offset-2"
              >
                Reset
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full transition bg-transparent hover:bg-light-secondary-text/20 dark:hover:bg-dark-secondary-text/20 text-light-secondary-text dark:text-dark-secondary-text"
              >
                <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="px-6 py-5 space-y-6">

            {/* Strict Mode */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border">
              <div>
                <p className="text-sm font-semibold text-light-text dark:text-dark-text">Strict Mode</p>
                <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text mt-0.5">
                  {filters.strictMode ? "All selected filters apply together (AND)" : "Any matching filter counts (OR)"}
                </p>
              </div>
              <button
                onClick={() => setFilters(prev => ({ ...prev, strictMode: !prev.strictMode }))}
                className="text-2xl transition-colors ml-4 shrink-0 bg-transparent hover:bg-light-secondary-text/20 dark:hover:bg-dark-secondary-text/20 p-1 rounded-full"
              >
                <FontAwesomeIcon
                  icon={filters.strictMode ? faToggleOn : faToggleOff}
                  className={filters.strictMode ? "text-light-accent dark:text-dark-accent" : "text-light-secondary-text dark:text-dark-secondary-text"}
                />
              </button>
            </div>

            {/* Type */}
            <div>
              <SectionLabel icon={faFilm} label="Type" />
              <div className="grid grid-cols-2 gap-2">
                {(["movie", "tv"] as const).map(type => (
                  <button key={type}
                    onClick={() => setFilters(prev => ({ ...prev, mediaType: type, genres: [], excludeGenres: [] }))}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      filters.mediaType === type
                        ? "bg-light-accent dark:bg-dark-accent text-white border-transparent"
                        : "bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border text-light-secondary-text dark:text-dark-secondary-text hover:border-light-accent dark:hover:border-dark-accent"
                    }`}>
                    <FontAwesomeIcon icon={type === "movie" ? faFilm : faTv} className="h-3" />
                    {type === "movie" ? "Movies" : "TV Shows"}
                  </button>
                ))}
              </div>
            </div>

            {/* Keywords - Multiple allowed */}
            <div>
              <SectionLabel icon={faTag} label="Keywords" />
              <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text mb-2 -mt-1">
                Search for media containing these keywords
              </p>
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  placeholder="e.g. heist, space, vampire…"
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addKeyword()}
                  className="flex-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl px-3 py-2 text-sm text-light-text dark:text-dark-text placeholder:text-light-secondary-text dark:placeholder:text-dark-secondary-text outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent" 
                />
                <button 
                  onClick={addKeyword}
                  disabled={!keywordInput.trim()}
                  className="px-3 py-2 rounded-xl bg-light-accent dark:bg-dark-accent text-white text-sm font-semibold transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faPlus} className="h-3.5" />
                </button>
              </div>
              {hasKeywords ? (
                <div className="flex flex-wrap gap-1.5 items-center">
                  {filters.keywords.map(kw => (
                    <button key={kw} onClick={() => removeKeyword(kw)}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-light-accent/10 dark:bg-dark-accent/10 border border-light-accent/25 dark:border-dark-accent/25 text-light-accent dark:text-dark-accent hover:bg-light-accent/20 dark:hover:bg-dark-accent/20 transition">
                      {kw}
                    </button>
                  ))}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, keywords: [] }))}
                    className="bg-transparent text-xs text-light-secondary-text dark:text-dark-secondary-text hover:text-light-text dark:hover:text-dark-text transition underline underline-offset-2">
                    clear all
                  </button>
                </div>
              ) : (
                <p className="text-xs text-light-secondary-text/50 dark:text-dark-secondary-text/50 italic">No keywords added yet.</p>
              )}
            </div>

            {/* Genres */}
            <div>
              <SectionLabel icon={faTag} label="Genres" />
              <p className="text-xs text-light-secondary-text inline dark:text-dark-secondary-text m-2 -mt-1 leading-snug">
                Tap once to <span className="inline text-light-accent dark:text-dark-accent font-semibold">include</span>{", "}twice to <span className="inline text-red-400 font-semibold">exclude</span>{", "}again to clear.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(genres).map(([name, id]) => (
                  <GenreChip key={id} name={name} state={genreState(id)} onClick={() => cycleGenre(id)} />
                ))}
              </div>
            </div>

            {/* Year + Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <SectionLabel icon={faCalendar} label="Release Year" />
                <DualRangeSlider min={MIN_YEAR} max={CURRENT_YEAR} value={filters.yearRange}
                  onChange={v => setFilters(prev => ({ ...prev, yearRange: v }))} />
              </div>
              <div>
                <SectionLabel icon={faStar} label="Rating" />
                <DualRangeSlider min={0} max={10} step={0.5} value={filters.ratingRange}
                  onChange={v => setFilters(prev => ({ ...prev, ratingRange: v }))}
                  formatLabel={v => `${v}★`} />
              </div>
            </div>

            {/* Sort */}
            <div>
              <SectionLabel label="Sort By" />
              <select value={filters.sortBy}
                onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="w-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl px-3 py-2.5 text-sm text-light-text dark:text-dark-text outline-none">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Blacklist Keywords */}
            <div>
              <SectionLabel icon={faBan} label="Blacklist Keywords" />
              <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text mb-2 -mt-1">
                Exclude media containing these words in title, description, or tags.
              </p>
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  placeholder="e.g. violence, war, zombies…"
                  value={blacklistKeywordInput}
                  onChange={e => setBlacklistKeywordInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addBlacklistKeyword()}
                  className="flex-1 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl px-3 py-2 text-sm text-light-text dark:text-dark-text placeholder:text-light-secondary-text dark:placeholder:text-dark-secondary-text outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent" 
                />
                <button 
                  onClick={addBlacklistKeyword}
                  disabled={!blacklistKeywordInput.trim()}
                  className="px-3 py-2 rounded-xl bg-light-accent dark:bg-dark-accent text-white text-sm font-semibold transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faPlus} className="h-3.5" />
                </button>
              </div>
              {hasExclusions ? (
                <div className="flex flex-wrap gap-1.5 items-center">
                  {filters.excludeGenres.map(id => {
                    const name = Object.entries(genres).find(([, gid]) => gid === id)?.[0];
                    if (!name) return null;
                    return (
                      <button key={id} onClick={() => cycleGenre(id)}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/25 transition">
                        {name}
                      </button>
                    );
                  })}
                  {filters.excludeKeywords.map(kw => (
                    <button key={kw} onClick={() => removeBlacklistKeyword(kw)}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/25 transition">
                      {kw}
                    </button>
                  ))}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, excludeGenres: [], excludeKeywords: [] }))}
                    className="bg-transparent text-xs text-light-secondary-text dark:text-dark-secondary-text hover:text-light-text dark:hover:text-dark-text transition underline underline-offset-2">
                    clear all
                  </button>
                </div>
              ) : (
                <p className="text-xs text-light-secondary-text/50 dark:text-dark-secondary-text/50 italic">No exclusions yet.</p>
              )}
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            {/* Fill button */}
            <button onClick={handleFill} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-light-accent dark:bg-dark-accent text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-50 mb-2">
              <FontAwesomeIcon icon={faDice} className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Filling wheel…" : "Fill Wheel"}
            </button>
          </div>
        </div>
      </div>

      <SliderStyles />
    </>
  );
}