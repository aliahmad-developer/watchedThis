import { Metadata } from "next";
import AboutPage from "./aboutPage";

export const metadata: Metadata = {
  title: "Creators | WatchedThis",
  description:
    "Hi! We're Missy and Tiba, creators of WatchedThis. Ending movie choice paralysis one random spin at a time.",
};

export default function Page() {
  return <>
    <h1 className="sr-only">Creators | WatchedThis</h1>
    <AboutPage />
  </>;
}
