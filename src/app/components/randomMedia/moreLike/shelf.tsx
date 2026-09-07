import SimilarMediaShelf from "./moreLikethis";
import { fetchSimilarMedia } from "@/lib/similarMedia";

interface Props {
  searchParams: {
    id?: string;
    type?: string;
  };
}

async function fetchSimilar(id: string, type: string) {
  try {
    // Calls the shared TMDB logic directly, in-process, instead of doing
    // fetch(`${appUrl}/api/echo?...`) back to this app's own domain.
    //
    // That self-fetch pattern is why this shelf silently stopped
    // rendering on Cloudflare: Cloudflare Workers restrict/fail same-zone
    // fetch() calls (a Worker calling its own public hostname) as a loop
    // prevention measure. The try/catch here swallowed the failure and
    // returned [], so the shelf just disappeared with no visible error —
    // it worked on localhost because there's no "zone" restriction on a
    // local dev server.
    const data = await fetchSimilarMedia(id, type as "movie" | "tv", 1);
    return (data.similar ?? []).slice(0, 12);
  } catch {
    return [];
  }
}

export default async function MoreLikeThis({
  searchParams,
}: Props) {
  const id = searchParams?.id;
  const type = searchParams?.type ?? "movie";

  if (!id) return null;

  const items = await fetchSimilar(id, type);

  if (!items.length) return null;

  return <SimilarMediaShelf items={items} />;
}