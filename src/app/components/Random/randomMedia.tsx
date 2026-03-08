"use client";
import { useEffect, useState, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { createSlug } from "../utilities/createSlug";
import { db } from "../../firebase/firebaseConfig"; // adjust if your firebase.ts lives elsewhere
import { doc, getDoc, setDoc } from "firebase/firestore";

interface MediaItem {
  id: number;
  title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  media_type?: string;
}

interface DailyMediaDoc {
  date: string;
  items: MediaItem[];
}

const FIRESTORE_COLLECTION = "appData";
const FIRESTORE_DOC        = "dailyMedia";
const LOCAL_CACHE_KEY      = "dailyMediaCache_v2";

export default function TwoSectionLayout() {
  const [media, setMedia]     = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchOneRandom = useCallback(async (): Promise<MediaItem> => {
    const res = await fetch("/api/randomCall");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || data.error) throw new Error("Invalid data");
    return data as MediaItem;
  }, []);

  const fetchNRandom = useCallback(
    async (n: number): Promise<MediaItem[]> => {
      const settled = await Promise.allSettled(
        Array.from({ length: n }, () => fetchOneRandom())
      );
      const ok = settled
        .filter((s): s is PromiseFulfilledResult<MediaItem> => s.status === "fulfilled")
        .map((s) => s.value);
      if (ok.length === 0) throw new Error("All fetches failed");
      return ok;
    },
    [fetchOneRandom]
  );

  const loadDailyMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    const today = new Date().toDateString();

    try {
      // ── 1. localStorage cache — skip Firestore read on repeat same-device visits ──
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        const parsed: DailyMediaDoc = JSON.parse(cached);
        if (parsed.date === today && parsed.items?.length > 0) {
          setMedia(parsed.items);
          setLoading(false);
          return;
        }
      }

      // ── 2. Read from Firestore ──
      const docRef  = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const remote = docSnap.data() as DailyMediaDoc;

        if (remote.date === today && remote.items?.length > 0) {
          // Today's data already in Firestore — just use it
          setMedia(remote.items);
          localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(remote));
          return;
        }

        // ── 3. New day: rotate — fetch 1 new item, prepend, keep latest 3 ──
        const newItem = await fetchOneRandom();
        const rotated: DailyMediaDoc = {
          date: today,
          items: [newItem, ...remote.items].slice(0, 3),
        };
        await setDoc(docRef, rotated);
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(rotated));
        setMedia(rotated.items);

      } else {
        // ── 4. First ever run — fetch 3 fresh items and seed Firestore ──
        const initial = await fetchNRandom(3);
        const seed: DailyMediaDoc = { date: today, items: initial.slice(0, 3) };
        await setDoc(docRef, seed);
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(seed));
        setMedia(seed.items);
      }

    } catch (err) {
      console.error("Error loading daily media:", err);

      // ── Fallback: serve stale localStorage data rather than show error ──
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        const parsed: DailyMediaDoc = JSON.parse(cached);
        if (parsed.items?.length > 0) {
          setMedia(parsed.items);
          setLoading(false);
          return;
        }
      }

      setError("Failed to load media. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [fetchOneRandom, fetchNRandom]);

  useEffect(() => {
    loadDailyMedia();
  }, [loadDailyMedia]);

  /* ---------- Render ---------- */

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6 bg-light-bg dark:bg-dark-bg">
        <header className="mb-6">
          <div className="flex mb-6">
            <div className="h-8 bg-gray-200 px-40 rounded w-64 animate-pulse" />
          </div>
        </header>
        <div className="hidden lg:grid grid-cols-3 gap-2 min-h-100">
          <div className="col-span-2"><FeaturedCardSkeleton /></div>
          <div className="flex flex-col gap-2">
            <RightStackCardSkeleton />
            <RightStackCardSkeleton />
          </div>
        </div>
        <div className="hidden md:block lg:hidden space-y-4">
          <FeaturedCardSkeleton />
          <div className="grid grid-cols-2 gap-2">
            <RightStackCardSkeleton />
            <RightStackCardSkeleton />
          </div>
        </div>
        <div className="block md:hidden">
          <FeaturedCardSkeleton />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 bg-light-bg dark:bg-dark-bg text-center">
        <p className="text-light-accent dark:text-dark-accent font-semibold">{error}</p>
        <button
          onClick={loadDailyMedia}
          className="rounded-lg bg-light-btn-bg dark:bg-dark-btn-bg text-light-btn-text dark:text-dark-btn-text px-6 py-2 transition hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 bg-light-bg dark:bg-dark-bg">
      <header className="mb-6">
        <h2 className="px-4 text-2xl font-bold mb-6">Recommended For You</h2>
      </header>

      {/* Desktop (≥1024px) */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-3 gap-2 min-h-75">
          <div className="col-span-2">
            {media[0] && <FeaturedCard item={media[0]} index={0} />}
          </div>
          <div className="flex flex-col space-y-2">
            {media.slice(1, 3).map((item, index) => (
              <RightStackCard key={item.id} item={item} index={index + 1} />
            ))}
            {media.length < 3 && (
              <div className="text-center text-gray-500 p-4 border border-dashed rounded-lg">
                More recommendations coming soon
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tablet (768–1023px) */}
      <div className="hidden md:flex lg:hidden flex-col gap-2">
        {media[0] && <FeaturedCard item={media[0]} index={0} />}
        <div className="grid grid-cols-2 gap-2">
          {media.slice(1, 3).map((item, index) => (
            <RightStackCard key={item.id} item={item} index={index + 1} />
          ))}
          {media.length < 3 &&
            Array.from({ length: 2 - (media.length - 1) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="text-center text-gray-500 p-4 border border-dashed rounded-lg flex items-center justify-center"
              >
                Coming soon
              </div>
            ))}
        </div>
      </div>

      {/* Mobile (<768px) */}
      <div className="block md:hidden">
        {media[0] && <FeaturedCard item={media[0]} index={0} />}
      </div>
    </section>
  );
}

/* ---------- Cards ---------- */

interface CardProps {
  item: MediaItem;
  index: number;
}

const FeaturedCard = memo(({ item, index }: CardProps) => {
  const hasBackdrop = !!item.backdrop_path;
  const imageUrl = getImageUrl(
    hasBackdrop ? item.backdrop_path : item.poster_path,
    1280
  );

  return (
    <div className="relative w-full h-64 md:h-80 lg:h-full rounded-xl overflow-hidden group bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border shadow-lg">
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt={item.title || "Media"}
          fill
          draggable={false}
          className={`transition-transform duration-700 scale-100 group-hover:scale-102 object-cover ${
            hasBackdrop ? "object-center" : "object-top"
          }`}
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 66vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 text-white z-10">
        <p className="text-xs opacity-80 mb-1">{getDayLabel(index)}</p>
        <h2 className="text-lg md:text-xl lg:text-2xl font-semibold leading-tight line-clamp-2 mb-2">
          {item.title || "Untitled"}
        </h2>
        <p className="text-sm text-gray-200 line-clamp-2 mb-4">
          {item.overview || "No description available."}
        </p>
        <Link
          href={`/${item.media_type || "movie"}/${createSlug(item.title || "")}/${item.id}`}
          className="inline-block hover:scale-105 hover:text-light-accent dark:hover:text-dark-accent transition-transform duration-300 ease-in-out"
        >
          View details
        </Link>
      </div>
    </div>
  );
});
FeaturedCard.displayName = "FeaturedCard";

const RightStackCard = memo(({ item, index }: CardProps) => {
  const hasPoster = !!item.poster_path;
  const imageUrl = getImageUrl(
    hasPoster ? item.poster_path : item.backdrop_path,
    500
  );

  return (
    <Link
      href={`/${item.media_type || "movie"}/${createSlug(item.title || "")}/${item.id}`}
      className="relative w-full h-49 rounded-xl overflow-hidden group bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border shadow-md hover:shadow-lg transition-shadow"
    >
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt={item.title || "Media"}
          fill
          className={`transition-transform duration-700 group-hover:scale-105 ${
            hasPoster ? "object-cover object-top" : "object-cover object-center"
          }`}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
        <p className="text-xs opacity-80 mb-1">{getDayLabel(index)}</p>
        <h3 className="text-base font-semibold leading-tight line-clamp-1 mb-1">
          {item.title || "Untitled"}
        </h3>
        <p className="text-xs text-gray-200 line-clamp-1">
          {item.overview || "No description available."}
        </p>
      </div>
    </Link>
  );
});
RightStackCard.displayName = "RightStackCard";

/* ---------- Utilities ---------- */
const getImageUrl = (path?: string | null, width = 1280): string =>
  path
    ? `https://image.tmdb.org/t/p/w${width}${path}`
    : "https://via.placeholder.com/800x450?text=No+Image";

const getDayLabel = (index: number): string => {
  if (index === 0) return "Today";
  if (index === 1) return "Yesterday";
  return `${index} days ago`;
};

/* ---------- Skeletons ---------- */
const FeaturedCardSkeleton = () => (
  <div className="relative w-full h-64 md:h-80 lg:h-full rounded-xl overflow-hidden bg-gray-300 dark:bg-gray-700 animate-pulse">
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/10 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
      <div className="h-4 w-24 bg-gray-400 rounded mb-2" />
      <div className="h-6 w-3/4 bg-gray-400 rounded mb-2" />
      <div className="h-4 w-5/6 bg-gray-400 rounded" />
    </div>
  </div>
);

const RightStackCardSkeleton = () => (
  <div className="relative w-full h-49 rounded-xl overflow-hidden bg-gray-300 dark:bg-gray-700 animate-pulse">
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/10 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <div className="h-3 w-16 bg-gray-400 rounded mb-1" />
      <div className="h-4 w-3/4 bg-gray-400 rounded mb-1" />
      <div className="h-3 w-5/6 bg-gray-400 rounded" />
    </div>
  </div>
);