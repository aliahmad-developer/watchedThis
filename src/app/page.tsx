import SpotLightServer from "./components/spotlight/spotLightServer";
import Trending from "./components/trending/TrendingCrousel";
import DailyMedia from "./components/dailyMedia/dailyMedia";
import RecommendationShelf from "./components/Recommendation/recommendationShelf";
import Strip from "./components/alphabetStrip/strip";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WatchedThis – Discover Your Next Favorite Movie",
  description:
    "Get personalized movie & TV show recommendations powered by AI. Discover films by scene, mood, or genre — tailored just for you.",
  keywords: [
    "movie recommendations",
    "personalized movies",
    "scene detection",
    "TV show discovery",
    "AI movie picker",
    "random movie",
  ],
  openGraph: {
    title: "WatchedThis – Personalized Movie & TV Recommendations",
    description:
      "AI-powered movie discovery. Get tailored picks, detect scenes, and never struggle to choose what to watch again.",
    url: "https://www.watchedthis.com",
    siteName: "WatchedThis",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WatchedThis, Personalized Movie & TV Recommendations",
    description:
      "AI-powered movie discovery. Get tailored picks, detect scenes, and never struggle to choose what to watch again.",
  },
};

export default function Home() {
  return (
    <>
     <h1 className="sr-only">WatchedThis, Discover Your Next Favorite Movie or TV Show</h1>
      <SpotLightServer />
      <div className="lg:mx-5 sm:mx-3 md:mx-4 min-h-400  ">
        <DailyMedia />
        <RecommendationShelf />
        <Trending />
        <Strip />
      </div>
    </>
  );
}
