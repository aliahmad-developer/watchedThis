import "./globals.css";
import SpotLightServer from "./components/spotlight/spotLightServer.tsx";
import Trending from "./components/trending/TrendingCrousel";
import Random from './components/Random/cont' 
export default function Home() {
  return (
    <>
      <div id="SpotLightServer">
        <SpotLightServer />
        <div className="lg:mx-5 ">
          <Trending />
        </div>
        <Random/>
      </div>
    </>
  );
}
