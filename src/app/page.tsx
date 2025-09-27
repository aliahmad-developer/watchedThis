import "./globals.css";
import SpotLightServer from "./components/spotlight/spotLightServer.tsx";
import Find from "./find/page";

import Trending from "./components/trending/TrendingCrousel";
export default function Home() {
  return (
    <>
      <div id="SpotLightServer">
        <SpotLightServer />
        <div className="lg:mx-5 ">
          <Trending />

          <div className="py-100"></div>
          <a href="#SpotLightServer">Click</a>
        </div>
      </div>
    </>
  );
}
