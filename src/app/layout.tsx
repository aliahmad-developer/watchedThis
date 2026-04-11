import "./globals.css";
import "../lib/fontawesome";
import ClientProviders from "./components/utilities/clientProvider/clientProvider";
import BackButton from "./components/utilities/backButton";
import Navbar from "./components/navbar/page";
import Footer from "./components/footer/footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.WatchedThis.com"),
  title: {
    default: "WatchedThis",
    template: "%s | WatchedThis",
  },
  description: "Discover movies and TV shows randomly",
  keywords: [
    "movies",
    "TV shows",
    "random movie",
    "film discovery",
    "what to watch",
    "movie recommendations",
    "movie like",
    "series like",
  ],
  openGraph: {
    siteName: "WatchedThis",
    type: "website",
    locale: "en_US",
    url: "https://www.WatchedThis.com",
    title: "WatchedThis, Discover Movies Randomly",
    description: "Discover movies and TV shows randomly",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "WatchedThis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WatchedThis – Discover Movies Randomly",
    description: "Discover movies and TV shows randomly",
    images: ["/og-default.png"],
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
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
      </head>

      <body className="bg-light-bg text-dark-text dark:bg-dark-bg dark:text-light-text transition-colors duration-300 min-h-screen">
        <ClientProviders>
          <Navbar />
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