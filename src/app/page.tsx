import SpotLightServer from "./components/spotlight/spotLightServer";
import Trending from "./components/trending/TrendingCarousel";
import DailyMedia from "./components/dailyMedia/dailyMedia";
import RecommendationShelf from "./components/Recommendation/recommendationShelf";
import Strip from "./components/alphabetStrip/strip";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WatchedThis - Best Random Movie Finder & TV Show Recommender",
  description:
    "AI-powered movie picker, scene detection, personalized TV recommendations. Find what to watch instantly with WatchedThis.",
  keywords: [
    "random movie generator",
    "movie finder",
    "random TV show picker",
    "random movie picker",
    "random anime picker",
    "what to watch tonight",
    "TV show recommendations",
    "scene detection movies",
    "AI movie recommendations",
    "film discovery platform",
    "movie picker",
    "best movies 2026",
    "trending TV shows",
  ],
  openGraph: {
    title: "WatchedThis - Movies tailored to your taste.",
    description:
      "AI-driven discovery platform for movies and TV shows, featuring scene detection, interactive spinner exploration, and personalized recommendations.",
    url: "https://watchedthis.com",
    siteName: "WatchedThis",
    type: "website",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "WatchedThis — Find Your Next Favorite Watch",
      },
    ],
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
    description:
      "AI-powered platform for discovering movies and TV shows through random selection, scene detection, and personalized recommendations.",
    url: "https://watchedthis.com",
    publisher: {
      "@type": "Organization",
      name: "WatchedThis",
      logo: {
        "@type": "ImageObject",
        url: "https://watchedthis.com/og",
      },
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Featured Movie & TV Content",
      description:
        "Curated trending movies, TV shows, daily picks, and personalized recommendations.",
      numberOfItems: 4,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Spotlight Trending Movies & Shows",
          url: "https://watchedthis.com/#spotlight",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Daily Media Recommendations",
          url: "https://watchedthis.com/#daily",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Personalized Recommendations",
          url: "https://watchedthis.com/#recommendations",
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Trending Now",
          url: "https://watchedthis.com/#trending",
        },
      ],
    },
    keywords: [
      "random movies",
      "movie discovery",
      "TV recommendations",
      "scene detection",
      "what to watch",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSchema) }}
      key="homepage-schema"
    />
  );
}

export default async function Home() {
  const [dailyRes, trendingRes] = await Promise.allSettled([
    fetch("https://watchedthis.com/api/dailyMedia", {
      next: { revalidate: 3600 },
    }),
    fetch("https://watchedthis.com/api/trending", {
      next: { revalidate: 3600 },
    }),
  ]);

  const dailyItems =
    dailyRes.status === "fulfilled" && dailyRes.value.ok
      ? ((await dailyRes.value.json()).data ?? [])
      : [];

  const trendingItems =
    trendingRes.status === "fulfilled" && trendingRes.value.ok
      ? ((await trendingRes.value.json()).results ?? [])
      : [];

  return (
    <>
      <h1 className="sr-only">
        WatchedThis, Best Random Movie Finder &amp; TV Show Recommender
      </h1>
      <SpotLightServer />
      <div className="mx-3 sm:mx-4 md:mx-5 lg:mx-7 xl:mx-10">
        <DailyMedia initialItems={dailyItems} />
        <RecommendationShelf />
        <Trending initialItems={trendingItems} />
        <Strip />
      </div>
      <HomepageSchema />
      <FAQSchema />
    </>
  );
}

function FAQSchema() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is a random movie picker?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A random movie picker instantly suggests movies or TV shows based on algorithms, genres, eras, and popularity – perfect when you can't decide what to watch.",
        },
      },
      {
        "@type": "Question",
        name: "How does WatchedThis find personalized recommendations?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Using your viewing history, behavior data, and AI matching against trending content from TMDB, we suggest hidden gems tailored to your taste.",
        },
      },
      {
        "@type": "Question",
        name: "What is scene detection in movies?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Scene detection analyzes keyframes to identify specific moments, moods, or visuals in films for precise discovery.",
        },
      },
      {
        "@type": "Question",
        name: "Can I create watchlists on WatchedThis?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, sign up for free to save lists, track watched items, and get better personalized picks.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      key="faq-schema"
    />
  );
}
