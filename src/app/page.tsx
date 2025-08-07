import "./globals.css";
import SpotLightServer from "./components/spotlight/spotLightServer.tsx";
import TrendingCarouselServer from "./components/trending/trendingSSR";
export default function Home() {
  return (
    <>
      <div>
        <SpotLightServer />
        <div className="mx-5">
          <TrendingCarouselServer/>
          <div className="p-100"></div>
        </div>
      </div>
    </>
  );
}
