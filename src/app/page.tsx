import "./globals.css";
import SpotLightServer from "./components/spotlight/spotLightServer.tsx";
import Trending from "./components/trending/TrendingCrousel";
export default function Home() {
  return (
    <>
      <div id="SpotLightServer">
        <SpotLightServer />
        <div className="lg:mx-5 ">
          <Trending />
          <div className="py-100"></div>
        </div>
      </div>
    </>
  );
}
