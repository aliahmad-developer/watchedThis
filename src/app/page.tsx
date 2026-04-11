import SpotLightServer from "./components/spotlight/spotLightServer";
import Trending from "./components/trending/TrendingCrousel";
import DailyMedia from "./components/dailyMedia/dailyMedia";
import RecommendationShelf from "./components/Recommendation/recommendationShelf";
import Strip from "./components/alphabetStrip/strip";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home',  
  description: 'Randomly discover top movies and TV shows. Fresh picks daily.',
  openGraph: {
    title: 'Home | RandoMovie',
    description: 'Randomly discover top movies and TV shows. Fresh picks daily.',
    url: 'https://www.randomovie.com',
  },
}

export default function Home() {
  return (
    <>
     
        <SpotLightServer />
        <div className="lg:mx-5 sm:mx-3 md:mx-4 min-h-400  ">
          <DailyMedia />
          <RecommendationShelf />
          <Trending />
          <Strip />
        </div>
    </>
  );
}
