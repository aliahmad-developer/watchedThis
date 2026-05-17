import SpotLightServer from "./components/spotlight/spotLightServer";
import Trending from "./components/trending/TrendingCarousel";
import DailyMedia from "./components/dailyMedia/dailyMedia";
import RecommendationShelf from "./components/Recommendation/recommendationShelf";
import Strip from "./components/alphabetStrip/strip";
import type { Metadata } from "next";
import SoftwareAppSchema from "@/breadCrumb/seo/SoftwareAppSchema";
import InternalLinkingHub from "@/breadCrumb/seo/InternalLinkingHub";

// ─── OG Image URL ─────────────────────────────────────────────────────────────
const homeOg = new URL("/og/", "https://watchedthis.com");
homeOg.searchParams.set("title", "WatchedThis — AI Movie & TV Discovery");
homeOg.searchParams.set(
  "subtitle",
  "Discover movies and TV shows instantly with AI-powered recommendations, trending picks, and scene detection.",
);

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL("https://watchedthis.com"),

  title: "WatchedThis - Best Random Movie Finder & TV Show Recommender",

  description:
    "AI-powered movie picker, scene detection, and personalized TV recommendations. Discover what to watch instantly with WatchedThis.",

  openGraph: {
    title: "WatchedThis - AI Movie & TV Discovery Platform",

    description:
      "Discover movies and TV shows instantly with AI-powered recommendations, trending picks, and scene detection.",

    url: "https://watchedthis.com",
    siteName: "WatchedThis",
    type: "website",

    images: [
      {
        url: homeOg.toString(),
        width: 1200,
        height: 630,
        alt: "WatchedThis — Discover Your Next Watch",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "WatchedThis - AI Movie & TV Discovery",
    description:
      "Find your next movie or show instantly with AI-powered recommendations and trending picks.",
    images: [homeOg.toString()],
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
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
        WatchedThis — AI Movie & TV Discovery Platform
      </h1>

      <SpotLightServer />

      <div className="mx-3 sm:mx-4 md:mx-5 lg:mx-7 xl:mx-10">
        <DailyMedia initialItems={dailyItems} />

        <RecommendationShelf />

        <Trending initialItems={trendingItems} />

        <InternalLinkingHub />

        <Strip />
      </div>

      <HomepageSchema />
      <FAQSchema />
      <SoftwareAppSchema feature="general" />
    </>
  );
}

// ─── Schemas ──────────────────────────────────────────────────────────────────
function HomepageSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",

    name: "WatchedThis Homepage",
    url: "https://watchedthis.com",

    description:
      "AI-powered platform for discovering movies and TV shows through recommendations, trending content, and scene detection.",

    publisher: {
      "@type": "Organization",
      "@id": "https://watchedthis.com/#organization",
      name: "WatchedThis",
      url: "https://watchedthis.com",
      logo: {
        "@type": "ImageObject",
        url: "https://watchedthis.com/android-chrome-512x512.png",
      },
    },

    mainEntity: {
      "@type": "ItemList",
      name: "Featured Content Sections",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Spotlight",
          url: "https://watchedthis.com/#spotlight",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Daily Picks",
          url: "https://watchedthis.com/#daily",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Recommendations",
          url: "https://watchedthis.com/#recommendations",
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Trending",
          url: "https://watchedthis.com/#trending",
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function FAQSchema() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",

    mainEntity: [
      {
        "@type": "Question",
        name: "What is a random movie picker?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A tool that instantly suggests movies or TV shows based on genres, trends, and AI recommendations.",
        },
      },
      {
        "@type": "Question",
        name: "How does WatchedThis work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "WatchedThis uses AI, TMDB data, and user behavior to recommend movies, shows, and hidden gems.",
        },
      },
      {
        "@type": "Question",
        name: "What is scene detection?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Scene detection identifies movies or shows from visual frames or descriptions.",
        },
      },
      {
        "@type": "Question",
        name: "Can I save watchlists?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, users can create and manage watchlists to track movies and TV shows.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
    />
  );
}
