import { Metadata } from "next";
import SearchClientPage from "./pageClient";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; keyword?: string }>;
}): Promise<Metadata> {
  const { q, keyword } = await searchParams;
  const term = q || keyword;

  const canonicalUrl = `https://watchedthis.com/search${term ? `?q=${encodeURIComponent(term)}` : ''}`;

  const title = term
    ? `"${term}" Search Results - Movies, TV, Cast | WatchedThis`
    : "Movie & TV Search - Find What to Watch | WatchedThis";

  const description = term
    ? `Results for "${term}": movies, TV shows, actors, more. Advanced search with AI recommendations on WatchedThis.`
    : "Search millions of movies, TV series, actors & more. Discover what to watch with intelligent search powered by AI.";

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords: [
      "movie search",
      "TV show search",
      "film database",
      "actor search",
      "search by scene",
      term ? `${term} movies` : "what to watch"
    ].filter(Boolean),
    robots: {
      index: !!term,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
    },
  };
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; keyword?: string }>;
}) {
  return <>
    <h1 className="sr-only">Advanced Movie TV Search Results | WatchedThis</h1>
    <SearchClientPage />
  </>;
}
