import SpotLightServer from "./components/spotlight/spotLightServer";
import Trending from "./components/trending/TrendingCrousel";
import DailyMedia from "./components/dailyMedia/dailyMedia";
import RecommendationShelf from "./components/Recommendation/recommendationShelf";
import Strip from "./components/alphabetStrip/strip";

export default function Home() {
  return (
    <>
      <div>
        <SpotLightServer />
        <div className="lg:mx-5 sm:mx-3 md:mx-4 min-h-400 ">
          <DailyMedia />
          <RecommendationShelf />
          <Trending />
          <Strip />
        </div>
      </div>
    </>
  );
}
