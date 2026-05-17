/**
 * SoftwareApplication Schema for WatchedThis features
 * Helps search engines understand the core functionality and improve ranking for tool-based queries
 */

interface SoftwareAppSchemaProps {
  feature: "scene-detection" | "random-picker" | "recommendations" | "general";
}

export default function SoftwareAppSchema({
  feature = "general",
}: SoftwareAppSchemaProps) {
  const baseSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "WatchedThis",
    description:
      "AI-powered movie and TV show discovery platform with scene detection, personalized recommendations, and advanced search.",
    url: "https://watchedthis.com",
    applicationCategory: "Entertainment",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.7",
      ratingCount: "1250",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    operatingSystem: "Web",
  };

  const schemas: Record<string, object> = {
    "scene-detection": {
      ...baseSchema,
      name: "WatchedThis Scene Detection",
      description:
        "AI-powered scene detection tool to identify movies and TV shows from screenshots, video clips, or scene descriptions.",
      featureList: [
        "Upload movie scenes to identify titles",
        "Describe a scene to find matching movies",
        "Advanced filters by genre, year, rating",
        "Support for movies, TV shows, and anime",
      ],
    },
    "random-picker": {
      ...baseSchema,
      name: "WatchedThis Random Movie Picker",
      description:
        "Discover what to watch next with AI-powered random recommendations, mood-based suggestions, and trending picks.",
      featureList: [
        "Random movie and TV show picker",
        "Daily featured recommendations",
        "Mood-based suggestions",
        "Trending content discovery",
        "Genre-based browsing",
      ],
    },
    recommendations: {
      ...baseSchema,
      name: "WatchedThis Recommendations",
      description:
        "Personalized movie and TV show recommendations powered by AI and your viewing history.",
      featureList: [
        "Personalized recommendations",
        "Watchlist management",
        "Trending content alerts",
        "Genre recommendations",
      ],
    },
    general: baseSchema,
  };

  const schema = schemas[feature] || baseSchema;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
