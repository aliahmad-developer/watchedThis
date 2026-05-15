import { Metadata } from "next";
import Breadcrumbs from "@/breadCrumb/seo/Breadcrumbs";
import MediaCard from "@/app/components/mediaCard/mediaCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
export const metadata: Metadata = {
  title: "Genres | WatchedThis",
  description: "Browse movies and TV shows by genre on WatchedThis.",
  alternates: { canonical: "https://watchedthis.com/genre" },
  openGraph: {
    title: "Genres | WatchedThis",
    description: "Browse movies and TV shows by genre on WatchedThis.",
    type: "website",
    url: "https://watchedthis.com/genre",
    siteName: "WatchedThis",
  },
  twitter: {
    card: "summary_large_image",
    title: "Genres | WatchedThis",
    description: "Browse movies and TV shows by genre on WatchedThis.",
  },
};

// ─── TMDB genre IDs — movies and TV use different IDs ────────────────────────
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
  "TV Movie": 10770,
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
  News: 10763,
  Reality: 10764,
  "Sci-Fi & Fantasy": 10765,
  Soap: 10766,
  Talk: 10767,
  "War & Politics": 10768,
  Western: 37,
};

// Build a unified list of sections: shared genres fetch both, exclusive fetch one
interface GenreSection {
  name: string;
  movieId: number | null;
  tvId: number | null;
  // slug uses movie id preferentially, then tv id
  slug: string;
}

function buildSections(): GenreSection[] {
  const sections: GenreSection[] = [];
  const seen = new Set<string>();

  // Shared genres — fetch both movie + tv
  for (const [name, movieId] of Object.entries(MOVIE_GENRES)) {
    const tvId = TV_GENRES[name] ?? null;
    const slug = `${movieId}-${toSlug(name)}`;
    sections.push({ name, movieId, tvId, slug });
    seen.add(name);
  }

  // TV-only genres
  for (const [name, tvId] of Object.entries(TV_GENRES)) {
    if (seen.has(name)) continue;
    const slug = `${tvId}-${toSlug(name)}`;
    sections.push({ name, movieId: null, tvId, slug });
  }

  return sections;
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function GenreListPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://watchedthis.com";
  const sections = buildSections();

  const genreSections = await Promise.all(
    sections.map(async ({ name, movieId, tvId, slug }) => {
      const fetches = await Promise.allSettled([
        movieId
          ? fetch(`${baseUrl}/api/genre/${movieId}?media_type=movie&page=1`, {
              next: { revalidate: 3600 },
            })
          : Promise.resolve(null),
        tvId
          ? fetch(`${baseUrl}/api/genre/${tvId}?media_type=tv&page=1`, {
              next: { revalidate: 3600 },
            })
          : Promise.resolve(null),
      ]);

      const [moviesRes, tvRes] = fetches;

      const movies =
        moviesRes.status === "fulfilled" &&
        moviesRes.value &&
        moviesRes.value.ok
          ? ((await moviesRes.value.json()).results ?? []).map((m: any) => ({
              ...m,
              media_type: "movie",
            }))
          : [];

      const tv =
        tvRes.status === "fulfilled" && tvRes.value && tvRes.value.ok
          ? ((await tvRes.value.json()).results ?? []).map((m: any) => ({
              ...m,
              media_type: "tv",
            }))
          : [];

      // Interleave movie + tv, cap at exactly 5
      // Build balanced movie/tv list
      // Build balanced movie/tv list
      const interleaved: any[] = [];

      const m = movies.filter((x: any) => x?.poster_path);
      const t = tv.filter((x: any) => x?.poster_path);

      let mi = 0;
      let ti = 0;

      while (interleaved.length < 5 && (mi < m.length || ti < t.length)) {
        if (mi < m.length) interleaved.push(m[mi++]);

        if (interleaved.length < 5 && ti < t.length) {
          interleaved.push(t[ti++]);
        }
      }

      return {
        name,
        slug,
        top: interleaved,
      };
    }),
  );

  return (
    <>
      <h1 className="sr-only">Genres | WatchedThis</h1>
      <Breadcrumbs
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Genres", href: "/genre" },
        ]}
      />

      <div className="container mx-auto px-4 py-8 min-h-screen">
        {/* Genre tag pills */}
        <h2 className="font-semibold mb-3 text-center">Browse by genre</h2>
        <div className="flex flex-wrap gap-2 mb-8">
          {sections.map(({ name, slug }) => (
            <a
              key={slug}
              href={`/genre/${slug}`}
              className="
                px-3 py-1 rounded-full border text-sm
                border-light-accent/30 dark:border-dark-accent/30
                text-light-accent dark:text-dark-accent
                bg-light-accent/5 dark:bg-dark-accent/5
                hover:bg-light-accent/15 dark:hover:bg-dark-accent/15
                hover:border-light-accent dark:hover:border-dark-accent
                transition-colors duration-200
              "
            >
              {name}
            </a>
          ))}
        </div>

        {/* 5-col grid per genre */}
        {genreSections.map(({ name, slug, top }) => (
          <section key={slug} className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Popular in {name}</h3>

              <a
                href={`/genre/${slug}`}
                className="
      group
      flex
      items-center
      text-sm
      font-medium
      leading-none
      text-light-accent
      dark:text-dark-accent
    "
              >
                <span className="hover:underline underline-offset-4 m-0">
                  See all
                </span>

                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="
        ml-1
        text-[10px]
        translate-y-[0.5px]
        transition-transform
        duration-200
        group-hover:translate-x-1
      "
                />
              </a>
            </div>

            {top.length ? (
              <div
                className="
                grid
                grid-cols-2
                sm:grid-cols-3
                lg:grid-cols-5
                gap-4
              "
              >
                {top.map((m: any, index: number) => (
                  <div
                    key={`${m.media_type}-${m.id}`}
                    className={`
        ${index >= 4 ? "hidden lg:block" : ""}
        ${index >= 3 ? "sm:hidden lg:block" : ""}
      `}
                  >
                    <MediaCard item={m} index={index} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No popular items right now.</p>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
