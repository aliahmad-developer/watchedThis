import "./globals.css";
import SpotLightServer from './components/spotlight/spotLightServer.tsx'
export default function Home() {
  return (
    <>
      <div>
        <SpotLightServer/>
        Trending
        <div className="p-100"></div>
      </div>
    </>
  );
}
