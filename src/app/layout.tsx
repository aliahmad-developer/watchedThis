import "./globals.css";
import "../lib/fontawesome";
import ClientProviders from "./components/utilities/clientProvider/clientProvider";
import BackButton from "./components/utilities/backButton";
import Navbar from "./components/navbar/navBar";
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
    "AI-powered movie and TV show discovery. Get random picks, scene detection, mood-based suggestions, and personalized recommendations.",

  openGraph: {
    siteName: "WatchedThis",
    type: "website",
    locale: "en_US",
    url: "https://watchedthis.com",
    title: "WatchedThis - Movie & TV Discovery",
    description:
      "Discover movies and TV shows instantly with AI-powered recommendations.",

    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "WatchedThis Preview",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "WatchedThis – Movie & TV Discovery",
    description:
      "Find your next watch instantly with AI-powered recommendations.",
    images: ["/og"],
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    shortcut: "/favicon.ico?v=2",
    icon: [
      { url: "/favicon-16x16.png?v=2", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
      {
        url: "/android-chrome-192x192.png?v=2",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png?v=2",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: "/apple-touch-icon.png?v=2",
  },

  manifest: "/site.webmanifest",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "WatchedThis",
  url: "https://watchedthis.com",
  logo: {
    "@type": "ImageObject",
    url: "https://watchedthis.com/android-chrome-512x512.png",
    width: 512,
    height: 512,
  },
  description: "AI-powered movie and TV discovery platform",
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
        {/* Google Tag Manager (must be in head but NOT via next/script) */}
        <script
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

        <meta name="theme-color" content="#1f2937" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="WatchedThis" />

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
          />
        </noscript>

        <ClientProviders>
          <Suspense fallback={null}>
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
