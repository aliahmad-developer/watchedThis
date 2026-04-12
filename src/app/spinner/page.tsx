import Spinner from "../components/spinner/spinner";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Spinner – Spin & Discover Your Next Movie | WatchedThis',
  description: 'Build your own custom movie spinner. Add filters by genre, mood, year and more — then spin to get your personalized pick. Make movie night fun again.',
  keywords: ['movie spinner', 'custom movie wheel', 'spin movie picker', 'movie wheel', 'movie night spinner', 'what to watch'],
  openGraph: {
    title: 'Spinner – Custom Movie Wheel | WatchedThis',
    description: 'Build your own movie spinner with custom filters. Spin the wheel and discover your next watch.',
    url: 'https://watchedthis.com/spinner',
    siteName: 'WatchedThis',
    type: 'website',
  },
  alternates: { canonical: '/spinner' },
  twitter: {
    card: 'summary_large_image',
    title: 'Spinner – Spin & Discover Your Next Movie | WatchedThis',
    description: 'Custom movie spinner with filters. Spin to find your next watch. 🎡',
  },
}
export default function Page() {
  return <>
    <h1 className="sr-only">Spinner – Spin & Discover Your Next Movie | WatchedThis</h1>
    <Spinner />
  </>;
}
