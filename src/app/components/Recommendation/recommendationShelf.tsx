"use client";
import AuthModal from "../auth/authModal";
import { useRef, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faWandMagicSparkles,
  faUserPlus,
  faSprayCanSparkles,
} from "@fortawesome/free-solid-svg-icons";

import MediaCard from "../mediaCard/mediaCard";
import { useRecommendations } from "./useRecommendations";
import type { ScoredItem } from "./types";

// ── Reason colours ────────────────────────────────────────────

const REASON_META: Record<string, { pill: string; dot: string; desc: string }> =
  {
    favourite: {
      pill: "bg-red-500/10 text-red-400 border-red-500/20",
      dot: "bg-red-400",
      desc: "This matches genres or tags from titles you've favourited.",
    },
    genre: {
      pill: "bg-teal-500/10 text-teal-400 border-teal-500/20",
      dot: "bg-teal-400",
      desc: "This fits the genres you watch most.",
    },
    search: {
      pill: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      dot: "bg-blue-400",
      desc: "This matched one of your recent search queries.",
    },
    library: {
      pill: "bg-violet-500/10 text-violet-400 border-violet-500/20",
      dot: "bg-violet-400",
      desc: "Similar to titles already saved in your library.",
    },
    click: {
      pill: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      dot: "bg-amber-400",
      desc: "You recently clicked or explored something like this.",
    },
    algo: {
      pill: "bg-gray-500/10 text-gray-400 border-gray-500/20",
      dot: "bg-gray-400",
      desc: "Picked based on your overall taste profile.",
    },
  };

// ── Why tooltip ───────────────────────────────────────────────

function WhyTooltip({ item }: { item: ScoredItem }) {
  const [open, setOpen] = useState(false);
  const [dir, setDir] = useState<"left" | "right">("left");
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const meta = REASON_META[item.reason.type] ?? REASON_META.algo;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const calcDir = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDir(window.innerWidth - rect.right < 200 ? "right" : "left");
    }
  };

  const handleOpen = () => {
    calcDir();
    setOpen((o) => !o);
  };

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        onMouseEnter={() => {
          calcDir();
          setOpen(true);
        }}
        onMouseLeave={(e) => {
          if ((e as any).pointerType === "touch") return;
          setOpen(false);
        }}
        onClick={handleOpen}
        aria-label="Why recommended"
        className={`mt-1 w-3.5 h-3.5 rounded-full border text-[8px] font-bold flex items-center justify-center transition-all duration-150 cursor-pointer leading-none ${meta.pill}`}
      >
        ?
      </button>

      {open && (
        <div
          className={`absolute bottom-full mb-2 z-50 w-48 rounded-xl p-3 shadow-xl 
            bg-light-bg dark:bg-dark-card border border-light-border dark:border-dark-border 
            ${dir === "left" ? "left-0" : "right-0"}`}
        >
          <div
            className={`absolute -bottom-1.25 w-2.5 h-2.5 rotate-45 
              bg-light-bg dark:bg-dark-card border-r border-b border-light-border dark:border-dark-border
              ${dir === "left" ? "left-3" : "right-3"}`}
          />
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
            <span className="text-[10px] font-bold uppercase tracking-wide text-light-header dark:text-dark-header">
              {item.reason.label}
            </span>
          </div>
          <p className="text-[10px] leading-relaxed text-light-secondary-text dark:text-dark-secondary-text">
            {meta.desc}
          </p>
          <div className="mt-2 pt-2 border-t border-light-border dark:border-dark-border flex items-center justify-between">
            <span className="text-[9px] text-light-secondary-text dark:text-dark-secondary-text">
              Match score
            </span>
            <span className="text-[10px] font-bold text-light-accent dark:text-dark-accent">
              {item.score} pts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="shrink-0 w-32 sm:w-40 md:w-44 lg:w-48 animate-pulse">
      <div className="aspect-2/3 rounded-xl bg-light-border dark:bg-dark-border" />
      <div className="mt-2 h-3 rounded bg-light-border dark:bg-dark-border w-4/5 mx-auto" />
      <div className="mt-1.5 h-2.5 rounded bg-light-border dark:bg-dark-border w-2/5 mx-auto" />
      <div className="mt-2 h-3.5 rounded-full bg-light-border dark:bg-dark-border w-3/5 mx-auto" />
    </div>
  );
}

// ── Shelf skeleton ,  rendered immediately on mount to hold layout space ───────

function ShelfSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 bg-light-bg dark:bg-dark-bg">
      {/* Header — mirrors real shelf header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-light-border dark:bg-dark-border animate-pulse" />
          <div className="w-36 h-5 rounded bg-light-border dark:bg-dark-border animate-pulse" />
        </div>
        {/* Scroll buttons placeholder (desktop only) */}
        <div className="hidden lg:flex gap-2">
          <div className="w-8 h-8 rounded-full bg-light-border dark:bg-dark-border animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-light-border dark:bg-dark-border animate-pulse" />
        </div>
      </div>

      {/* Cards — mirrors ScoredCard widths */}
      <div className="flex gap-4 overflow-hidden pb-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="shrink-0 w-32 sm:w-40 md:w-44 lg:w-48 animate-pulse">
            <div className="aspect-2/3 rounded-xl bg-light-border dark:bg-dark-border" />
            <div className="mt-2 h-3 rounded bg-light-border dark:bg-dark-border w-4/5 mx-auto" />
            <div className="mt-1.5 h-2.5 rounded bg-light-border dark:bg-dark-border w-2/5 mx-auto" />
            <div className="mt-2 w-3.5 h-3.5 rounded-full bg-light-border dark:bg-dark-border mx-auto" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Scored card ───────────────────────────────────────────────

function ScoredCard({
  item,
  onCardClick,
}: {
  item: ScoredItem;
  onCardClick?: (item: ScoredItem) => void;
}) {
  const mediaType = item.media_type ?? "movie";

  return (
    <div
      className="shrink-0 w-32 sm:w-40 md:w-44 lg:w-48 flex flex-col cursor-pointer"
      onClick={() => onCardClick?.(item)}
    >
      <MediaCard item={item} hideMetaData />
      <div
        className="flex items-center justify-center gap-1.5 mt-1 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <WhyTooltip item={item} />
      </div>
    </div>
  );
}

// ── Guest CTA ─────────────────────────────────────────────────

function GuestCTA() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 bg-light-bg dark:bg-dark-bg">
      <div className="flex items-center gap-2 mb-6 px-1">
        <FontAwesomeIcon
          icon={faWandMagicSparkles}
          className="text-light-accent dark:text-dark-accent ml-1"
          style={{ width: "1.5rem", height: "1.5rem" }}
        />
        <h2>Tailored For You</h2>
      </div>

      <div className="mx-5 mb-5 relative overflow-hidden rounded-2xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-card p-6 flex flex-col sm:flex-row items-center gap-5">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-light-accent/10 dark:bg-dark-accent/10 blur-3xl pointer-events-none" />

        <div className="shrink-0 w-14 h-14 rounded-2xl bg-light-accent/10 dark:bg-dark-accent/10 flex items-center justify-center">
          <FontAwesomeIcon
            icon={faSprayCanSparkles}
            className="text-light-accent dark:text-dark-accent ml-1"
            style={{ width: "1.5rem", height: "1.5rem" }}
            bounce
          />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-bold text-base text-light-header dark:text-dark-header mb-1">
            Get personalised recommendations
          </h3>
          <p className="text-sm text-light-secondary-text dark:text-dark-secondary-text leading-relaxed">
            Create a free account and we'll learn your taste , suggesting movies
            and shows based on what you search, save, and watch.
          </p>
        </div>

        <button
          onClick={() => setAuthOpen(true)}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-light-btn-bg hover:bg-light-btn-hover-bg text-light-btn-text dark:bg-dark-btn-bg dark:hover:bg-dark-btn-hover-bg dark:text-dark-btn-text transition whitespace-nowrap"
        >
          <FontAwesomeIcon icon={faUserPlus} className="h-3.5 w-3.5" />
          Create Account
        </button>

        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    </section>
  );
}

// ── Main shelf ────────────────────────────────────────────────

interface RecommendationShelfProps {
  title?: string;
  limit?: number;
  excludeWatched?: boolean;
  excludeIds?: number[];
  onCardClick?: (item: ScoredItem) => void;
}

export default function RecommendationShelf({
  title = "Tailored For You",
  limit = 12,
  excludeWatched = true,
  excludeIds = [],
  onCardClick,
}: RecommendationShelfProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let unsub: any;
    const initAuth = async () => {
      const firebase = await import("../../firebase/firebaseConfig");
      const authInstance = await firebase.getFirebaseAuth();
      unsub = authInstance.onAuthStateChanged((user) => setIsLoggedIn(!!user));
    };
    initAuth();
    return () => unsub?.();
  }, []);

  const { recommendations, isLoading, error } = useRecommendations({
    limit,
    excludeWatched,
    excludeIds,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 8);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 8);
  };

  const scroll = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 480, behavior: "smooth" });
  };

  // Auth not resolved yet ,  render skeleton immediately to hold layout space,
  // preventing Trending from jumping up on mount
  if (isLoggedIn === null) return <ShelfSkeleton />;

  // Guest ,  show CTA
  if (!isLoggedIn) return <GuestCTA />;

  // Logged in but nothing to show , hide silently
  if (!isLoading && (error || recommendations.length === 0)) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 bg-light-bg dark:bg-dark-bg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon
            icon={faWandMagicSparkles}
            className="text-light-accent dark:text-dark-accent h-4 w-4"
          />
          <h2>{title}</h2>
        </div>

        <div className="hidden lg:flex gap-2">
          <button
            onClick={() => scroll(-1)}
            disabled={atStart}
            aria-label="Scroll left"
            className="w-8 h-8 rounded-full border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-card flex items-center justify-center text-light-secondary-text dark:text-dark-secondary-text hover:bg-light-border dark:hover:bg-dark-border disabled:opacity-30 transition"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
          </button>
          <button
            onClick={() => scroll(1)}
            disabled={atEnd}
            aria-label="Scroll right"
            className="w-8 h-8 rounded-full border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-card flex items-center justify-center text-light-secondary-text dark:text-dark-secondary-text hover:bg-light-border dark:hover:bg-dark-border disabled:opacity-30 transition"
          >
            <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Scroll track */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
          style={{ scrollbarWidth: "none" }}
        >
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : recommendations.map((item) => (
                <ScoredCard
                  key={`${item.id}-${item.media_type}`}
                  item={item}
                  onCardClick={onCardClick}
                />
              ))}
        </div>

        {!atStart && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-10 bg-linear-to-r from-light-bg dark:from-dark-bg to-transparent" />
        )}
        {!atEnd && recommendations.length > 0 && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-10 bg-linear-to-l from-light-bg dark:from-dark-bg to-transparent" />
        )}
      </div>
    </section>
  );
}
