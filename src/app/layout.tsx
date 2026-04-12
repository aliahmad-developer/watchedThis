import "./globals.css";
import "../lib/fontawesome";
import ClientProviders from "./components/utilities/clientProvider/clientProvider";
import ClientHead from "./components/seo/ClientHead";
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
    "AI-powered movie and TV show discovery. Random picks, scene detection, personalized recommendations & what to watch next.",
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
      "Discover movies & TV randomly with AI. Scene detection, personalized recs, mood-based picks.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "WatchedThis - Random Movie Finder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WatchedThis – AI Movie & TV Discovery",
    description:
      "Random movie picker with scene detection & personalized recommendations.",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
       
<Script
  id="google-tag-manager"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KD79MGZ4');`
  }}
/>

        <link
          rel="preconnect"
          href="https://image.tmdb.org"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        <ClientHead />
      </head>

      <body className="bg-light-bg text-dark-text dark:bg-dark-bg dark:text-light-text transition-colors duration-300 min-h-screen">
        {/* Google Tag Manager (noscript) */}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KD79MGZ4"
        height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}></iframe></noscript>
        {/* End Google Tag Manager (noscript) */}
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
