"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faXmark,
  faLayerGroup,
  faSpinner,
  faWaveSquare,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import Fuse from "fuse.js";
import { trackSearch } from "../components/Recommendation/behaviourTracker";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchHit {
  id: number;
  title: string;
  type: "movie" | "tv";
  year: string;
  poster: string | null;
  vote: number;
}

interface SimilarItem {
  id: number;
  title: string;
  type: "movie" | "tv";
  year: string;
  poster: string | null;
  backdrop: string | null;
  vote: number;
  overview: string;
  genre_ids: number[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const mediaUrl = (type: string, title: string, id: number) =>
  `/${type}/${slugify(title)}/${id}`;

// ── Ambient color helpers ─────────────────────────────────────────────────────

const COLOR_SCHEME_MQ = "(prefers-color-scheme: light)";
const calcLuminance = (r: number, g: number, b: number) =>
  (0.299 * r + 0.587 * g + 0.114 * b) / 255;

interface AmbientColor {
  solid: string;
  rgb: string;
  rawRgb: string;
  luminance: number;
}

const buildAmbient = (
  r: number,
  g: number,
  b: number,
  light: boolean,
): AmbientColor => {
  const lum = calcLuminance(r, g, b);
  if (light) {
    const f = lum < 0.5 ? 1.5 : 1.2;
    const cr = Math.min(Math.floor(r * f + 50), 235);
    const cg = Math.min(Math.floor(g * f + 50), 235);
    const cb = Math.min(Math.floor(b * f + 50), 235);
    return {
      solid: `rgb(${cr},${cg},${cb})`,
      rgb: `${cr},${cg},${cb}`,
      rawRgb: `${r},${g},${b}`,
      luminance: calcLuminance(cr, cg, cb),
    };
  } else {
    const f = lum > 0.5 ? 0.2 : lum > 0.3 ? 0.3 : 0.45;
    const cr = Math.max(Math.floor(r * f), 0);
    const cg = Math.max(Math.floor(g * f), 0);
    const cb = Math.max(Math.floor(b * f), 0);
    return {
      solid: `rgb(${cr},${cg},${cb})`,
      rgb: `${cr},${cg},${cb}`,
      rawRgb: `${r},${g},${b}`,
      luminance: lum,
    };
  }
};

const getAmbientText = (
  light: boolean,
  rawRgb: string,
  processedLum: number,
) => {
  const [r, g, b] = rawRgb.split(",").map(Number);
  const useLightText = !light || processedLum < 0.45;
  if (!useLightText) {
    const dp = (v: number) => Math.max(Math.floor(v * 0.28), 0);
    const ds = (v: number) => Math.max(Math.floor(v * 0.48 + 18), 0);
    return {
      primary: `rgba(${dp(r)},${dp(g)},${dp(b)},0.92)`,
      secondary: `rgba(${ds(r)},${ds(g)},${ds(b)},0.80)`,
      muted: `rgba(${ds(r)},${ds(g)},${ds(b)},0.55)`,
    };
  } else {
    const lp = (v: number) => Math.min(Math.floor(v * 2.0 + 140), 255);
    const ls = (v: number) => Math.min(Math.floor(v * 1.8 + 85), 255);
    return {
      primary: `rgba(${lp(r)},${lp(g)},${lp(b)},0.95)`,
      secondary: `rgba(${ls(r)},${ls(g)},${ls(b)},0.85)`,
      muted: `rgba(${ls(r)},${ls(g)},${ls(b)},0.50)`,
    };
  }
};

// ── Hooks ─────────────────────────────────────────────────────────────────────
function proxyUrl(tmdbPath: string, size: string): string {
  const upstream = `https://image.tmdb.org/t/p/${size}${tmdbPath}`;
  return `/api/image-proxy?url=${encodeURIComponent(upstream)}`;
}

function useTheme() {
  const [light, setLight] = useState(false);
  const check = useCallback(() => {
    setLight(
      document.documentElement.classList.contains("light") ||
        window.matchMedia(COLOR_SCHEME_MQ).matches,
    );
  }, []);
  useEffect(() => {
    check();
    const mq = window.matchMedia(COLOR_SCHEME_MQ);
    mq.addEventListener("change", check);
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      mq.removeEventListener("change", check);
      obs.disconnect();
    };
  }, [check]);
  return light;
}

function useAmbient(imageUrl: string | null, light: boolean) {
  const [ambient, setAmbient] = useState<AmbientColor | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const busy = useRef(false);

  const extract = useCallback(async () => {
    if (!imgRef.current || busy.current) return;
    const img = imgRef.current;
    if (img.naturalWidth === 0) return;
    busy.current = true;
    try {
      const { default: ColorThief } = await import("color-thief-browser");
      const ct = new ColorThief();
      const [r, g, b] = ct.getColor(img);
      setAmbient(buildAmbient(r, g, b, light));
    } catch {
      setAmbient(null);
    } finally {
      busy.current = false;
    }
  }, [light]);

  useEffect(() => {
    setAmbient(null);
  }, [imageUrl, light]);

  useEffect(() => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const run = () => setTimeout(extract, 80);
    if (img.complete) run();
    else img.addEventListener("load", run);
    return () => img.removeEventListener("load", run);
  }, [extract, imageUrl]);

  return { imgRef, ambient };
}

// ── Search Dropdown ───────────────────────────────────────────────────────────

function SearchDropdown({
  hits,
  query,
  onSelect,
  onClose,
  quickPicks,
}: {
  hits: SearchHit[];
  query: string;
  onSelect: (hit: SearchHit) => void;
  onClose: () => void;
  quickPicks: SearchHit[];
}) {
  const isQuick = query.trim() === "";
  const items = isQuick ? quickPicks : hits;

  if (items.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-50 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border border-t-0 rounded-b-2xl shadow-2xl overflow-hidden animate-[dropDown_0.18s_ease_out]">
      {isQuick && (
        <div className="px-3 sm:px-4 pt-2.5 pb-1">
          <span className="text-[10px] font-mono tracking-widest text-light-secondary-text dark:text-dark-secondary-text uppercase">
            Trending this week
          </span>
        </div>
      )}
      <div className="max-h-[52vh] overflow-y-auto">
        {items.map((hit, i) => (
          <div
            key={`${hit.type}-${hit.id}`}
            className="opacity-0 animate-[fadeUp_0.22s_ease_forwards]"
            style={{ animationDelay: `${i * 25}ms` }}
          >
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(hit);
              }}
              className="flex items-start gap-3 w-full px-3 sm:px-4 py-2.5 text-left hover:bg-light-card dark:hover:bg-dark-card transition-colors"
            >
              {hit.poster ? (
                <img
                  src={hit.poster}
                  alt=""
                  className="w-8 h-12 object-cover rounded shrink-0 mt-0.5"
                />
              ) : (
                <div className="w-8 h-12 rounded shrink-0 mt-0.5 bg-light-disabled dark:bg-dark-disabled" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-light-body-text dark:text-dark-body-text text-sm font-semibold truncate leading-tight">
                  {hit.title}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-light-card dark:bg-dark-card text-light-secondary-text dark:text-dark-secondary-text font-medium">
                    {hit.type === "movie" ? "Movie" : "TV"}
                  </span>
                  <span className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                    {hit.year || "—"}
                  </span>
                  {hit.vote > 0 && (
                    <>
                      <span className="text-light-disabled dark:text-dark-disabled text-xs">
                        •
                      </span>
                      <span className="text-color-accent text-xs font-bold font-mono">
                        ★ {hit.vote.toFixed(1)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </button>
            {i < items.length - 1 && (
              <div className="border-t border-light-border dark:border-dark-border mx-3 sm:mx-4" />
            )}
          </div>
        ))}
      </div>
      {!isQuick && (
        <Link
          href={`/search?q=${encodeURIComponent(query)}`}
          onClick={onClose}
          className="block text-center px-4 py-2.5 border-t border-light-border dark:border-dark-border bg-light-btn-bg text-light-btn-text font-medium hover:bg-light-btn-hover-bg hover:text-light-btn-hover-text dark:bg-dark-btn-bg dark:text-dark-btn-text dark:hover:bg-dark-btn-hover-bg dark:hover:text-dark-btn-hover-text transition-colors text-xs tracking-wide"
        >
          View all results for &ldquo;{query}&rdquo;
        </Link>
      )}
    </div>
  );
}

// ── Media Card ────────────────────────────────────────────────────────────────

function MediaCard({
  item,
  isLightMode,
}: {
  item: SimilarItem;
  isLightMode: boolean;
}) {
  const imageUrl = item.backdrop
    ? proxyUrl(item.backdrop, "w1280")
    : item.poster
      ? proxyUrl(item.poster, "w780")
      : null;

  const { imgRef, ambient } = useAmbient(imageUrl, isLightMode);

  const fallbackRgb = isLightMode ? "210,210,210" : "15,15,15";
  const fallbackSolid = isLightMode ? "rgb(210,210,210)" : "rgb(15,15,15)";
  const solidColor = ambient?.solid ?? fallbackSolid;
  const rgbColor = ambient?.rgb ?? fallbackRgb;
  const rawRgb = ambient?.rawRgb ?? fallbackRgb;
  const processedLum = ambient?.luminance ?? (isLightMode ? 0.8 : 0.06);
  const textColor = getAmbientText(isLightMode, rawRgb, processedLum);

  const fullTint = `rgba(${rgbColor}, 0.45)`;
  const layerBottom = `linear-gradient(to top, rgba(${rgbColor},1) 0%, rgba(${rgbColor},0.7) 12%, rgba(${rgbColor},0.3) 26%, rgba(${rgbColor},0) 42%)`;
  const layerTop = `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 18%)`;
  const layerCenter = `radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)`;
  const rating = item.vote ? item.vote.toFixed(1) : null;

  return (
    <Link
      href={mediaUrl(item.type, item.title, item.id)}
      className="block group w-full rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
      style={{
        backgroundColor: solidColor,
        transition: "background-color 700ms ease-in-out",
      }}
    >
      <div className="relative w-full overflow-hidden aspect-4/3 sm:aspect-16/6 lg:aspect-16/5">
        {imageUrl ? (
          <Image
            ref={imgRef}
            src={imageUrl}
            alt={item.title}
            unoptimized
            fill
            crossOrigin="anonymous"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 1280px"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-gray-700 to-gray-900" />
        )}
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{ backgroundColor: fullTint }}
        />
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{ background: layerBottom }}
        />
        <div className="absolute inset-0" style={{ background: layerTop }} />
        <div className="absolute inset-0" style={{ background: layerCenter }} />
        {rating && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-black/40 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
            <FontAwesomeIcon icon={faStar} /> {rating}
          </div>
        )}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 text-[10px] text-white sm:text-xs px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
          {item.type === "movie" ? "Film" : "Series"}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12 gap-1">
          <h3
            className="text-base sm:text-2xl lg:text-3xl font-bold text-center drop-shadow-lg line-clamp-2 transition-colors duration-700 leading-snug"
            style={{ color: textColor.primary }}
          >
            {item.title}
          </h3>
          <p
            className="text-[10px] sm:text-sm italic transition-colors duration-700"
            style={{ color: textColor.muted }}
          >
            {item.year}
          </p>
        </div>
      </div>
      <div
        className="px-3 sm:px-4 py-2 sm:py-3 transition-all duration-700"
        style={{ backgroundColor: solidColor }}
      >
        <p
          className="text-xs sm:text-sm leading-snug line-clamp-2 transition-colors duration-700"
          style={{ color: textColor.secondary }}
        >
          {item.overview || "No description available."}
        </p>
      </div>
    </Link>
  );
}

// ── Card Skeleton ─────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="w-full rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 animate-pulse">
      <div style={{ aspectRatio: "16/5" }} />
      <div className="px-3 sm:px-4 py-2 sm:py-3 space-y-2">
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-2.5 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
  );
}

// ── Variant generator ─────────────────────────────────────────────────────────

function generateVariants(query: string): string[] {
  const q = query.trim();
  const set = new Set<string>([q]);
  const words = q.split(/\s+/);
  words.filter((w) => w.length >= 3).forEach((w) => set.add(w));
  if (words.length === 1) {
    for (let i = 0; i < q.length - 1; i++) {
      const chars = q.split("");
      [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
      set.add(chars.join(""));
    }
  }
  return [...set].filter((v) => v.length >= 2);
}

// ── Main Client Component ─────────────────────────────────────────────────────

export default function EchoClient() {
  const isLightMode = useTheme();

  const [query, setQuery] = useState("");
  const [rawHits, setRawHits] = useState<SearchHit[]>([]);
  const [dropOpen, setDropOpen] = useState(false);
  const [sugLoading, setSugLoading] = useState(false);

  const [cards, setCards] = useState<SimilarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceTitle, setSourceTitle] = useState<string | null>(null);
  const [isTrending, setIsTrending] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedHit, setSelectedHit] = useState<SearchHit | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const justSelected = useRef(false);
  const quickPicksRef = useRef<SearchHit[]>([]);

  const fuse = useMemo(
    () =>
      new Fuse(rawHits, {
        keys: [
          { name: "title", weight: 0.6 },
          { name: "year", weight: 0.15 },
          { name: "type", weight: 0.15 },
        ],
        threshold: 0.5,
        distance: 200,
        includeScore: true,
        minMatchCharLength: 2,
        ignoreLocation: true,
        shouldSort: true,
      }),
    [rawHits],
  );
  const suggestions = useMemo<SearchHit[]>(() => {
    if (!query.trim() || rawHits.length === 0) return rawHits;
    const results = fuse.search(query.trim());
    return results.length > 0 ? results.map((r) => r.item) : rawHits;
  }, [fuse, query, rawHits]);

  // ── Initial trending fetch ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/echo?trending=true");
        const data = await res.json();
        const results: SimilarItem[] = data.results ?? [];
        setCards(results);
        setHasMore(data.has_more ?? false);
        setIsTrending(true);
        quickPicksRef.current = results.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          year: item.year,
          poster: item.poster ? proxyUrl(item.poster, "w92") : null,
          vote: item.vote,
        }));
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch suggestions ─────────────────────────────────────────────────────
  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setRawHits([]);
      return;
    }
    setSugLoading(true);
    try {
      const variants = generateVariants(q);
      const allRes = await Promise.all(
        variants.map((v) =>
          fetch(`/api/echo?query=${encodeURIComponent(v)}`)
            .then((r) => (r.ok ? r.json() : { results: [] }))
            .catch(() => ({ results: [] })),
        ),
      );
      const seen = new Set<string>();
      const merged: SearchHit[] = [];
      for (const data of allRes) {
        for (const item of (data.results ?? []) as SearchHit[]) {
          const key = `${item.type}-${item.id}`;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(item);
          }
        }
      }
      setRawHits(merged);
    } catch {
      setRawHits([]);
    } finally {
      setSugLoading(false);
    }
  }, []);

  // ── Reset to trending when query cleared ──────────────────────────────────
  useEffect(() => {
    if (query !== "" || isTrending) return;
    setError(null);
    setSourceTitle(null);
    setSelectedHit(null);
    setIsTrending(true);
    setPage(1);
    setLoading(true);
    fetch("/api/echo?trending=true")
      .then((r) => r.json())
      .then((data) => {
        const results: SimilarItem[] = data.results ?? [];
        setCards(results);
        setHasMore(data.has_more ?? false);
        quickPicksRef.current = results.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          year: item.year,
          poster: item.poster ? proxyUrl(item.poster, "w92") : null,
          vote: item.vote,
        }));
      })
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, [query, isTrending]);

  // ── Debounced suggestions fetch ───────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  // ── Select title ──────────────────────────────────────────────────────────
  const selectTitle = useCallback(async (hit: SearchHit) => {
    await trackSearch(hit.title);
    justSelected.current = true;
    setDropOpen(false);
    setRawHits([]);
    setQuery(hit.title);
    setCards([]);
    setError(null);
    setLoading(true);
    setIsTrending(false);
    setSourceTitle(hit.title);
    setSelectedHit(hit);
    setPage(1);
    try {
      const res = await fetch(`/api/echo?id=${hit.id}&type=${hit.type}&page=1`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCards(data.similar ?? []);
      setHasMore(data.has_more ?? false);
    } catch {
      setError("Could not load results. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => {
        justSelected.current = false;
      }, 200);
    }
  }, []);

  // ── Load more ─────────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const url = isTrending
        ? `/api/echo?trending=true&page=${nextPage}`
        : `/api/echo?id=${selectedHit?.id}&type=${selectedHit?.type}&page=${nextPage}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const newItems: SimilarItem[] = isTrending
        ? (data.results ?? [])
        : (data.similar ?? []);
      setCards((prev) => {
        const existingKeys = new Set(prev.map((c) => `${c.type}-${c.id}`));
        const deduped = newItems.filter(
          (item) => !existingKeys.has(`${item.type}-${item.id}`),
        );
        return [...prev, ...deduped];
      });
      setHasMore(data.has_more ?? false);
      setPage(nextPage);
    } catch (error) {
      console.error("Trending fetch failed:", error);
      setError("Failed to load trending content.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, isTrending, selectedHit]);

  const handleClear = useCallback(() => {
    setQuery("");
    setRawHits([]);
    setDropOpen(false);
  }, []);

  const dropShouldOpen =
    dropOpen &&
    (query.trim() === ""
      ? quickPicksRef.current.length > 0
      : suggestions.length > 0);

  const dimTextClass =
    "text-light-secondary-text dark:text-dark-secondary-text";

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-5">
        {/* ── Header ── */}
        <div className="text-center space-y-3 pt-4">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
            Discover what to watch{" "}
            <em className="text-color-accent not-italic">next.</em>
          </h1>
          <p
            className={`${dimTextClass} text-xs sm:text-sm max-w-lg mx-auto leading-relaxed`}
          >
            Echo uses machine learning to find similar media based on synopsis,
            score, reviews, and more.{" "}
            <span className="text-light-body-text dark:text-dark-body-text opacity-50">
              Search any title to get started.
            </span>
          </p>
        </div>

        {/* ── Search ── */}
        <div ref={wrapRef} className="relative">
          <div
            className={`flex items-center bg-light-card dark:bg-dark-card border-2 transition-all duration-200 ${
              dropShouldOpen
                ? "border-color-accent rounded-t-2xl rounded-b-none"
                : "border-light-border dark:border-dark-border rounded-2xl"
            }`}
          >
            <span className="px-3.5 text-light-secondary-text dark:text-dark-secondary-text flex items-center shrink-0">
              {sugLoading ? (
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="w-3.5 h-3.5 text-color-accent animate-spin"
                />
              ) : (
                <FontAwesomeIcon icon={faSearch} className="w-3.5 h-3.5" />
              )}
            </span>
            <input
              value={query}
              onChange={(e) => {
                justSelected.current = false;
                setQuery(e.target.value);
                if (e.target.value) setDropOpen(true);
              }}
              onFocus={() => {
                if (!justSelected.current) setDropOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                if (dropOpen) {
                  const list =
                    query.trim() === "" ? quickPicksRef.current : suggestions;
                  if (list.length > 0) selectTitle(list[0]);
                }
              }}
              placeholder="Search movies or TV series…"
              className="flex-1 border-none outline-none bg-transparent text-light-body-text dark:text-dark-body-text placeholder-light-secondary-text dark:placeholder-dark-secondary-text text-base py-3.5 font-inherit"
            />
            {query && (
              <button
                onClick={handleClear}
                className="bg-transparent px-4 text-light-secondary-text dark:text-dark-secondary-text hover:text-color-accent transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            )}
          </div>

          {dropShouldOpen && (
            <SearchDropdown
              hits={suggestions}
              query={query}
              onSelect={selectTitle}
              onClose={() => setDropOpen(false)}
              quickPicks={quickPicksRef.current}
            />
          )}
        </div>

        {/* ── Section label ── */}
        {!loading && cards.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="w-0.5 h-4 bg-color-accent rounded shrink-0" />
            <p
              className={`${dimTextClass} text-[11px] font-mono tracking-wider m-0`}
            >
              {isTrending
                ? "TRENDING THIS WEEK"
                : `SIMILAR TO — ${sourceTitle?.toUpperCase()}`}
            </p>
          </div>
        )}

        {/* ── Skeletons ── */}
        {loading && (
          <div className="space-y-3 sm:space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="text-center py-10">
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={handleClear}
              className="mt-3 text-xs text-color-accent hover:underline"
            >
              Back to trending
            </button>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && cards.length === 0 && sourceTitle && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="text-4xl opacity-30">
              <FontAwesomeIcon icon={faWaveSquare} />
            </div>
            <p className="text-light-body-text dark:text-dark-body-text font-medium text-sm">
              No results found for &ldquo;{sourceTitle}&rdquo;
            </p>
            <p className={`${dimTextClass} text-xs max-w-xs leading-relaxed`}>
              We don&apos;t have recommendations for this title yet. Try
              exploring something more popular.
            </p>
            <button
              onClick={handleClear}
              className="mt-2 text-xs text-color-accent hover:underline"
            >
              Back to trending
            </button>
          </div>
        )}

        {/* ── Cards ── */}
        {!loading && cards.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            {cards.map((item) => (
              <MediaCard
                key={`${item.type}-${item.id}`}
                item={item}
                isLightMode={isLightMode}
              />
            ))}
          </div>
        )}

        {/* ── Load More ── */}
        {!loading && hasMore && (
          <div className="flex justify-center pt-2 pb-6">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card text-light-body-text dark:text-dark-body-text text-sm font-medium hover:border-color-accent hover:text-color-accent hover:bg-light-bg dark:hover:bg-dark-bg hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {loadingMore ? (
                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="w-3.5 h-3.5 animate-spin"
                  />
                  Loading…
                </>
              ) : (
                <>
                  <FontAwesomeIcon
                    icon={faLayerGroup}
                    className="w-3.5 h-3.5"
                  />
                  Load more
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes dropDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
