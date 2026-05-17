import { Metadata } from "next";
import Breadcrumbs from "@/breadCrumb/seo/Breadcrumbs";
import EchoClient from "./clientPage";
import SoftwareAppSchema from "@/breadCrumb/seo/SoftwareAppSchema";

export const metadata: Metadata = {
  metadataBase: new URL("https://watchedthis.com"),

  title: "Echo – Find Movies & Shows Similar to What You Loved | WatchedThis",

  description:
    "Describe a movie, TV show, or anime you loved and Echo instantly finds similar titles using plot, genre, keywords, and synopsis matching.",

  alternates: {
    canonical: "/echo",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "Echo – Find Movies & Shows Similar to What You Loved | WatchedThis",

    description:
      "Type any movie, show, or anime and Echo finds similar titles by matching plot, genre, keywords, and synopsis.",

    url: "https://watchedthis.com/echo",
    siteName: "WatchedThis",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title: "Echo – Find Movies & Shows Similar to What You Loved | WatchedThis",

    description:
      "Type any movie, show, or anime and Echo finds similar titles instantly.",
  },
};

function EchoFAQSchema({
  host = "https://watchedthis.com",
}: {
  host?: string;
}) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",

    mainEntity: [
      {
        "@type": "Question",
        name: "What does Echo match on?",

        acceptedAnswer: {
          "@type": "Answer",

          text: "Echo finds similar movies, TV shows, and anime by comparing plot, genre, keywords, and synopsis so recommendations feel accurate and relevant.",
        },
      },

      {
        "@type": "Question",
        name: "Do I need to type a full movie title?",

        acceptedAnswer: {
          "@type": "Answer",

          text: "No. You can type part of a title or describe what you liked and Echo will generate similar recommendations.",
        },
      },

      {
        "@type": "Question",
        name: "Can Echo recommend anime and TV shows too?",

        acceptedAnswer: {
          "@type": "Answer",

          text: "Yes. Echo supports movies, TV shows, and anime recommendations using similarity matching.",
        },
      },

      {
        "@type": "Question",
        name: "Where does WatchedThis get movie and TV data?",

        acceptedAnswer: {
          "@type": "Answer",

          text: "WatchedThis uses TMDB data including titles, descriptions, genres, and images to power discovery features like Echo.",
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
      key="echo-faq-schema"
    />
  );
}

export default function EchoPage() {
  return (
    <>
      <h1 className="sr-only">
        Echo – Find Similar Movies, TV Shows, and Anime Instantly
      </h1>

      <Breadcrumbs
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Echo", href: "/echo" },
        ]}
      />

      <div className="min-h-screen">
        <EchoClient />
      </div>

      <EchoFAQSchema />
      <SoftwareAppSchema feature="recommendations" />
    </>
  );
}
