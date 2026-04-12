import SpotLightServer from "./components/spotlight/spotLightServer";
import Trending from "./components/trending/TrendingCrousel";
import DailyMedia from "./components/dailyMedia/dailyMedia";
import RecommendationShelf from "./components/Recommendation/recommendationShelf";
import Strip from "./components/alphabetStrip/strip";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WatchedThis - Best Random Movie Finder & TV Show Recommender",
  description:
    "AI-powered random movie picker, scene detection, personalized TV recommendations. Find what to watch instantly with WatchedThis.",
  keywords: [
    "random movie generator",
    "movie finder",
    "what to watch tonight",
    "TV show recommendations",
    "scene detection movies",
    "AI movie recommendations",
    "film discovery platform",
    "movie picker",
    "best movies 2024",
    "trending TV shows"
  ],
  alternates: {
    canonical: 'https://watchedthis.com/',
  },
  openGraph: {
    title: "WatchedThis - #1 Random Movie Finder & TV Recommender",
    description:
      "AI-powered discovery platform. Scene detection, mood matching, personalized picks for movies & TV.",
    url: "https://watchedthis.com",
    siteName: "WatchedThis",
    type: "website",
    images: [{
      url: "/og-default.png",
      width: 1200,
      height: 630,
      alt: "WatchedThis Random Movie Finder"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "WatchedThis - Random Movie & TV Discovery",
    description:
      "Never wonder what to watch again. AI-powered random picks with scene detection & recommendations.",
  },
};

function HomepageSchema() {
  const homepageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "WatchedThis - Movie & TV Discovery Homepage",
    description: "AI-powered platform for discovering movies and TV shows through random selection, scene detection, and personalized recommendations.",
    url: "https://watchedthis.com",
    publisher: {
      "@type": "Organization",
      name: "WatchedThis",
      logo: {
        "@type": "ImageObject",
        url: "https://watchedthis.com/og-default.png"
      }
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Featured Movie & TV Content",
      description: "Curated trending movies, TV shows, daily picks, and personalized recommendations.",
      numberOfItems: 4,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Spotlight Trending Movies & Shows",
          url: "https://watchedthis.com/#spotlight"
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Daily Media Recommendations",
          url: "https://watchedthis.com/#daily"
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Personalized Recommendations",
          url: "https://watchedthis.com/#recommendations"
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Trending Now",
          url: "https://watchedthis.com/#trending"
        }
      ]
    },
    keywords: ["random movies", "movie discovery", "TV recommendations", "scene detection", "what to watch"]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSchema) }}
      key="homepage-schema"
    />
  );
}

export default function Home() {
  return (
    <>
     <h1 className="sr-only">WatchedThis, Best Random Movie Finder &amp; TV Show Recommender</h1>
      <SpotLightServer />
      <div className="lg:mx-5 sm:mx-3 md:mx-4 min-h-400  ">
        <DailyMedia />
        <RecommendationShelf />
        <Trending />
        <Strip />
      </div>
      <HomepageSchema />
    </>
  );
}
