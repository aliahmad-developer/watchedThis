import { Suspense } from "react";
import SceneDetect from "../components/sceneDetection/sceneCamera";
import FindPageClient from "./findClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Find – Scene Detection & Advanced Movie Filters | WatchedThis',
  description: 'Describe a scene and we\'ll identify the movie or show. Use powerful filters by genre, mood, year, rating and more to find exactly what you\'re looking for.',
  keywords: ['scene detection', 'find movie by scene', 'movie scene finder', 'advanced movie filter', 'movie search by description'],
  openGraph: {
    title: 'Find – Scene Detection & Advanced Movie Filters | WatchedThis',
    description: 'Describe a scene and we\'ll identify the movie. Plus powerful filters to find exactly what you want to watch.',
    url: 'https://watchedthis.com/find',
    siteName: 'WatchedThis',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find – Scene Detection & Advanced Filters | WatchedThis',
    description: 'Describe a scene and find the movie instantly. Powered by AI.',
  },
}

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FindPageClient />
      <SceneDetect />
    </Suspense>
  );
}