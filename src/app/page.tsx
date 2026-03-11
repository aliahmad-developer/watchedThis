import "./globals.css";
import SpotLightServer from "./components/spotlight/spotLightServer";
import Trending from "./components/trending/TrendingCrousel";
import Random from "./components/Random/randomMedia";
import RecommendationShelf from "./components/Recommendation/recommendationShelf";

export default function Home() {
  return (
    <>
      <div>
        <SpotLightServer />
        <div className="lg:mx-5 ">
          <Random />
          <RecommendationShelf />
          <Trending />
        </div>
      </div>
    </>
  );
}
