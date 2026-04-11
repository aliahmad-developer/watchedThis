import { Metadata } from "next";
import GenrePageClient from "./genrePage"; // rename current file to this

const GENRE_NAMES: Record<string, string> = {
  action: "Action",
  comedy: "Comedy",
  drama: "Drama",
  horror: "Horror",
  romance: "Romance",
  thriller: "Thriller",
  "sci-fi": "Science Fiction",
  animation: "Animation",
  documentary: "Documentary",
  fantasy: "Fantasy",
  crime: "Crime",
  mystery: "Mystery",
  adventure: "Adventure",
  family: "Family",
  history: "History",
  music: "Music",
  war: "War",
  western: "Western",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ genreId: string }>;
}): Promise<Metadata> {
  const { genreId } = await params;

  const genreName =
    GENRE_NAMES[genreId.toLowerCase()] ||
    genreId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const description = `Browse the best ${genreName} movies and TV shows. Discover top-rated ${genreName.toLowerCase()} titles, hidden gems, and new releases on WatchedThis.`;

  return {
    title: `${genreName} Movies & TV Shows | WatchedThis`,
    description,
    alternates: {
      canonical: `https://watchedthis.com/genre/${genreId}`,
    },
    openGraph: {
      title: `${genreName} Movies & TV Shows | WatchedThis`,
      description,
      url: `https://watchedthis.com/genre/${genreId}`,
      siteName: "WatchedThis",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${genreName} Movies & TV Shows | WatchedThis`,
      description,
    },
  };
}

export default function GenrePage({
  params,
}: {
  params: Promise<{ genreId: string }>;
}) {
  return <GenrePageClient />;
}