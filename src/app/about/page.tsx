import { Metadata } from "next";
import AboutPage from "./aboutPage";

export const metadata: Metadata = {
  title: "Creators | RandoMovie",
  description:
    "Hi! We're Missy and Tiba, creators of RandoMovie. Ending movie choice paralysis one random spin at a time.",
};

export default function Page() {
  return <AboutPage />;
}