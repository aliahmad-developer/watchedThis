import "./globals.css";
import SpotLight from "./components/spotlight/spotlightSection";
export default function Home() {
  return (
    <>
      <div>
        <SpotLight />
        Trending
        <div className="p-100"></div>
      </div>
    </>
  );
}
