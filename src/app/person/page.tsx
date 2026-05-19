import { Metadata } from "next";
import Link from "next/link";
import MediaCard from "@/app/components/mediaCard/mediaCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

export const metadata: Metadata = {
  title: "Popular Actors | WatchedThis",
  description: "Discover trending actors and their best movies on WatchedThis.",
  alternates: { canonical: "https://watchedthis.com/person" },
  openGraph: {
    title: "Popular Actors | WatchedThis",
    description: "Discover trending actors and their best movies.",
    type: "website",
    url: "https://watchedthis.com/person",
    siteName: "WatchedThis",
  },
};

// ─────────────────────────────────────────────────────────────
// Fetch helpers
// ─────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://watchedthis.com";

async function getJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchTopActors() {
  const data = await getJSON<{ results: any[] }>(
    `${BASE_URL}/api/tmdb?path=/person/popular`
  );

  return (data?.results ?? [])
    .filter((p) => p?.profile_path)
    .slice(0, 10); // top actors list
}

async function fetchActorMovies(personId: number) {
  const data = await getJSON<{ cast: any[] }>(
    `${BASE_URL}/api/tmdb?path=/person/${personId}/movie_credits`
  );

  return (data?.cast ?? [])
    .filter((m) => m?.poster_path)
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 7);
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default async function PersonPage() {
  const actors = await fetchTopActors();

  const enriched = await Promise.all(
    actors.map(async (actor) => {
      const movies = await fetchActorMovies(actor.id);
      return { actor, movies };
    })
  );
  

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-xl font-bold mb-6">Popular Actors</h1>

      {/* Actor sections */}
      {enriched.map(({ actor, movies }) => (
        <section key={actor.id} className="mb-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img
                src={`https://image.tmdb.org/t/p/w92${actor.profile_path}`}
                alt={actor.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <h2 className="font-semibold text-lg">{actor.name}</h2>
            </div>

            <Link
              href={`/person/${actor.slug ?? actor.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${actor.id}`}
              className="flex items-center text-sm text-light-accent dark:text-dark-accent group"
            >
              <span className="hover:underline underline-offset-4">
                See all
              </span>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="ml-1 text-[10px] transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>

          {/* Movies grid */}
          {movies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {movies.map((movie: any, index: number) => (
                <div
                  key={`${movie.id}-${index}`}
                  className={`${index >= 7 ? "hidden" : ""}`}
                >
                  <MediaCard
                    item={{
                      id: movie.id,
                      title: movie.title,
                      poster_path: movie.poster_path,
                      media_type: "movie",
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-light-secondary-text">
              No movies available.
            </p>
          )}
        </section>
      ))}
    </div>
  );
}