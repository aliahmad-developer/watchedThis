import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import MediaTypePageClient from './pageClient';
interface PageProps {
  params: Promise<{ media_type: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ media_type: string }>;
}): Promise<Metadata> {
  const { media_type } = await params;
  const title = media_type === 'movie' ? 'Movies - Popular & Trending Films | WatchedThis' : 'TV Shows - Popular Series & Episodes | WatchedThis';
  const description = media_type === 'movie' 
    ? 'Discover popular movies, trending films, and new releases. Browse by popularity, genres, and more.' 
    : 'Explore popular TV shows, trending series, and latest episodes. Find your next binge-watch.';

  return {
    title,
    description,
  alternates: { canonical: `/${media_type}` }, 
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { media_type } = await params;
  const validTypes = ['movie', 'tv'] as const;
  if (!validTypes.includes(media_type.toLowerCase() as any)) {
    notFound();
  }

  return (
    <>
      <MediaTypePageClient />
    </>
  );
}
