import "./globals.css";
import SpotLightServer from "./components/spotlight/spotLightServer.tsx";
import Trending from "./components/trending/TrendingCrousel";
import Random from "./components/Random/randomMedia";

export default function Home() {
  return (
    <>
      <div id="SpotLightServer">
        <SpotLightServer />
        <div className="lg:mx-5 ">
          <Random />
          <Trending />
        </div>
       
      </div>
    </>
  );
}
