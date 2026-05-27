// app/components/randomMedia/moreLike/moreLikethis.tsx

import SimilarMediaShelf from "./moreLikethis";

interface Props {
  searchParams: {
    id?: string;
    type?: string;
  };
}

async function fetchSimilar(id: string, type: string) {
  try {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      "https://watchedthis.com";

    const res = await fetch(
      `${appUrl}/api/echo?id=${id}&type=${type}&page=1`,
      {
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();

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