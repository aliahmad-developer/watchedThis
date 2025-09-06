// components/TrendingCarouselServer.tsx

import TrendingCarouselClient from "./trendingCSR";

export default async function TrendingCarouselServer() {
  const trendingRes = await fetch("http://localhost:3000/api/trending", {
    cache: "no-store",
  });

  const trendingData = await trendingRes.json();

  return (
    <>
      <TrendingCarouselClient media={trendingData.results} />
    </>
  );
}
