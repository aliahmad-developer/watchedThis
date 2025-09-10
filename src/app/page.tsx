import "./globals.css";
import SpotLightServer from "./components/spotlight/spotLightServer.tsx";


import Trending from "./components/trending/trendingCSR";
export default function Home() {
  return (
    <>
      <div>
        <SpotLightServer />
        <div className="mx-5">
          <Trending />
          <div className="p-100"></div>
        </div>
      </div>
    </>
  );
}
