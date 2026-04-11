import { Metadata } from "next";
import SearchClientPage from "./pageClient";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; keyword?: string }>;
}): Promise<Metadata> {
  const { q, keyword } = await searchParams;
  const term = q || keyword;

  return {
    title: term
      ? `"${term}" — Search Results | WatchedThis`
      : "Search Movies & TV Shows | WatchedThis",
    description: term
      ? `Search results for "${term}". Find movies, TV series, cast and more on WatchedThis.`
      : "Search thousands of movies and TV shows on WatchedThis.",
    robots: {
      index: false, 
      follow: true,
    },
  };
}

export default function SearchPage() {
  return <SearchClientPage />;
}