import { notFound } from "next/navigation";
import { Metadata } from "next";
import MediaTypePageClient from "./pageClient";
interface PageProps {
  params: Promise<{ media_type: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ media_type: string }>;
}): Promise<Metadata> {
  const { media_type } = await params;
  const title =
    media_type === "movie"
      ? "Movies - Popular & Trending Films | WatchedThis"
      : "TV Shows - Popular Series & Episodes | WatchedThis";
  const description =
    media_type === "movie"
      ? "Discover popular movies, trending films, and new releases. Browse by popularity, genres, and more."
      : "Explore popular TV shows, trending series, and latest episodes. Find your next binge-watch.";

  return {
    title,
    description,
    alternates: { canonical: `/${media_type}` },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

function MediaTypeFAQSchema({ mediaType }: { mediaType: "movie" | "tv" }) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What kinds of ${mediaType === "movie" ? "movies" : "TV shows"} appear on WatchedThis?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `WatchedThis features popular titles, trending recommendations, and discovery-driven results for ${mediaType === "movie" ? "movies" : "TV"}. Use genres and your preferences to explore.`,
        },
      },
      {
        "@type": "Question",
        name: "How do I find something I’ll actually enjoy?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Start with genre browsing, then refine with search and recommendations. If you remember a vibe instead of a title, use Echo or Find.`,
        },
      },
      {
        "@type": "Question",
        name: "Do your recommendations depend on my activity?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "If you sign in and use recommendations, your experience can become more personalized over time.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      key={`media-type-faq-${mediaType}`}
    />
  );
}

export default async function Page({ params }: PageProps) {
  const { media_type } = await params;
  const validTypes = ["movie", "tv"] as const;
  const type = media_type.toLowerCase() as "movie" | "tv";

  if (!validTypes.includes(type)) {
    notFound();
  }

  const titleLabel = type === "movie" ? "Movies" : "TV Shows";

  return (
    <>
      <h1 className="sr-only">{titleLabel} on WatchedThis</h1>

      <MediaTypePageClient />

      <MediaTypeFAQSchema mediaType={type} />
    </>
  );
}
