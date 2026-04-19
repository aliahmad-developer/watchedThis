import { Metadata } from "next";
import EchoClient from "./clientPage";

export const metadata: Metadata = {
  title: "Echo – Find Movies & Shows Similar to What You Loved | WatchedThis",
  description:
    "Describe a movie or show or anime you loved and Echo finds similar ones instantly. Matches by plot, genre, keywords, and synopsis — just type something like 'movies like Sherlock Holmes'.",
  keywords: [
    "movie like",
    "anime like",
    "drama like",
    "similar movie",
    "movies like",
    "similar movies",
    "similar movies",
    "find movies like this",
    "shows similar to",
    "movie recommendations by plot",
    "find movies by synopsis",
    "similar tv shows",
  ],
  alternates: { canonical: '/echo' },
  openGraph: {
    title: "Echo – Find Movies & Shows Similar to What You Loved | WatchedThis",
    description:
      "Type any movie or show and Echo finds similar ones by matching plot, genre, keywords, and synopsis.",
    url: "https://watchedthis.com/echo",
    siteName: "WatchedThis",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Echo – Find Movies & Shows Similar to What You Loved | WatchedThis",
    description:
      "Type any movie or show and Echo finds similar ones by plot, genre, and synopsis.",
  },
};

export default function EchoPage() {
  return (
    <>
      <h1 className="sr-only">
        Echo – Find Movies and TV Shows Similar to What You Already Watched
      </h1>
      <EchoClient />
    </>
  );
}