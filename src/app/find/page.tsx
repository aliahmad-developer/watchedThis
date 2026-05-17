import { Suspense } from "react";
import SceneDetect from "../components/sceneDetection/sceneCamera";
import FindPageClient from "./findClient";
import type { Metadata } from "next";
import Breadcrumbs from "@/breadCrumb/seo/Breadcrumbs";
import SoftwareAppSchema from "@/breadCrumb/seo/SoftwareAppSchema";

export const metadata: Metadata = {
  metadataBase: new URL("https://watchedthis.com"),

  title: "Find – Scene Detection & Advanced Movie Filters | WatchedThis",

  description:
    "Find movies, TV shows, and anime from scenes, screenshots, or descriptions. Use AI-powered scene detection and advanced filters by genre, mood, year, rating, and more.",

  alternates: {
    canonical: "/find",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "Find – Scene Detection & Advanced Movie Filters | WatchedThis",

    description:
      "Upload a screenshot, describe a scene, or use advanced filters to instantly find movies, TV shows, and anime.",

    url: "https://watchedthis.com/find",
    siteName: "WatchedThis",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title: "Find – Scene Detection & Advanced Movie Filters | WatchedThis",

    description:
      "Upload a scene or describe a movie moment to identify movies and shows instantly.",
  },
};

export const dynamic = "force-dynamic";

function FindFAQSchema() {
  const faqSchema = {
    "@context": "https://schema.org",

    "@type": "FAQPage",

    mainEntity: [
      {
        "@type": "Question",
        name: "How does scene detection work?",

        acceptedAnswer: {
          "@type": "Answer",

          text: "Upload or capture a movie or TV scene and WatchedThis compares visual moments and metadata to identify the most likely title.",
        },
      },

      {
        "@type": "Question",
        name: "Can I find a movie from a screenshot?",

        acceptedAnswer: {
          "@type": "Answer",

          text: "Yes. You can upload screenshots or scene captures and WatchedThis will try to identify the movie, TV show, or anime.",
        },
      },

      {
        "@type": "Question",
        name: "What filters can I use?",

        acceptedAnswer: {
          "@type": "Answer",

          text: "You can filter by genre, year, rating, keywords, themes, mood, and more to narrow down results.",
        },
      },

      {
        "@type": "Question",
        name: "Can I search using a description instead of an image?",

        acceptedAnswer: {
          "@type": "Answer",

          text: "Yes. You can describe a plot, scene, character, or vibe and WatchedThis will generate matching recommendations.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(faqSchema),
      }}
      key="find-faq-schema"
    />
  );
}

export default function Page() {
  return (
    <>
      <h1 className="sr-only">
        Find Movies, TV Shows, and Anime by Scene or Screenshot
      </h1>

      <Breadcrumbs
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Find", href: "/find" },
        ]}
      />

      <div className="min-h-screen">
        <Suspense fallback={null}>
          <FindPageClient />
          {/* Scene detect modal is triggered by SceneCamera component (query param controlled there) */}
          <SceneDetect />
        </Suspense>
      </div>

      <FindFAQSchema />
      <SoftwareAppSchema feature="scene-detection" />
    </>
  );
}
