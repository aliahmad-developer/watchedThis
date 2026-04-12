import "./globals.css";
import "../lib/fontawesome";
import ClientProviders from "./components/utilities/clientProvider/clientProvider";
import BackButton from "./components/utilities/backButton";
import Navbar from "./components/navbar/page";
import Footer from "./components/footer/footer";
import { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://watchedthis.com"),
  title: {
    default: "WatchedThis - Random Movie & TV Show Finder",
    template: "%s | WatchedThis - Movie & TV Discovery",
  },
  description:
    "AI-powered movie and TV show discovery. Get random picks, scene detection, mood-based suggestions, and personalized recommendations for what to watch next.",
  keywords: [
    "random movie",
    "movie finder",
    "what to watch",
    "TV show recommendations",
    "movie discovery",
    "scene detection",
    "AI movies",
    "film recommendations",
    "series like",
    "movie picker",
  ],
  openGraph: {
    siteName: "WatchedThis",
    type: "website",
    locale: "en_US",
    url: "https://watchedthis.com",
    title: "WatchedThis - Random Movie & TV Discovery Platform",
    description:
      "Discover movies and TV shows instantly with AI. Random picks, scene detection, mood-based filters, and personalized recommendations — all in one place.",
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
    title: "WatchedThis – AI Movie & TV Discovery",
    description:
      "Random movie picker with scene detection, mood-based filters, and personalized recommendations. Find your next watch in seconds.",
    images: ["/og"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    shortcut: "/favicon.ico",
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

// Server-side structured data — Googlebot will always see this
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "WatchedThis",
  url: "https://watchedthis.com",
  logo: "https://watchedthis.com/og",
  description: "AI-powered movie and TV show discovery platform",
  knowsAbout: ["movies", "TV shows", "film discovery", "scene detection"],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "WatchedThis",
  url: "https://watchedthis.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://watchedthis.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Tag Manager — single analytics source */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KD79MGZ4');`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />

        <link
          rel="preconnect"
          href="https://image.tmdb.org"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
      </head>

      <body className="bg-light-bg text-dark-text dark:bg-dark-bg dark:text-light-text transition-colors duration-300 min-h-screen">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KD79MGZ4"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>

        <ClientProviders>
          <Suspense>
            <Navbar />
          </Suspense>

          <div className="relative">
            <div className="absolute top-2 left-3 z-40">
              <BackButton />
            </div>
            {children}
          </div>
        </ClientProviders>
        <Footer />
      </body>
    </html>
  );
}
