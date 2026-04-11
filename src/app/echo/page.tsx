import { Metadata } from "next";
import EchoClient from "./clientPage";

export const metadata: Metadata = {
  title: "Echo, Find Movies You've Already Watched | WatchedThis",
  description:
    "Can't remember the name of a movie or series you watched before? Echo helps you find it instantly. Search your memory, we'll find the match.",
  keywords: [
    "find watched movies",
    "movie I watched",
    "cant remember movie name",
    "find series I watched",
    "movie finder",
  ],
  alternates: { canonical: '/echo' },
  openGraph: {
    title: "Echo, Find Movies You've Already Watched | WatchedThis",
    description:
      "Can't remember the name of a movie or series you watched before? Echo helps you find it instantly.",
    url: "https://watchedthis.com/echo",
    siteName: "WatchedThis",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Echo, Find Movies You've Already Watched | WatchedThis",
    description:
      "Can't remember the name of a movie or series? Echo finds it for you.",
  },
};

export default function EchoPage() {
  return <EchoClient />;
}