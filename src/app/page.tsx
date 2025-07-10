import "./globals.css";
import SpotLightServer from "./components/spotlight/spotLightServer.tsx";
export default function Home() {
  return (
    <>
      <div>
        <SpotLightServer />
        <div className="mx-10">
          Trending
          <div className="p-100"></div>
        </div>
      </div>
    </>
  );
}
