// components/TrendingCarouselServer.tsx

import TrendingCarouselClient from "./trendingCSR";

export default async function TrendingCarouselServer() {
  const res = await fetch("http://localhost:3000/api/trending", {
    cache: "no-store",
  });
  const data = await res.json();

  return <TrendingCarouselClient media={data.results} />;
}
