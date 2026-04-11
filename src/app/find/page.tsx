import { Suspense } from "react";
import SceneDetect from "../components/sceneDetection/sceneCamera";
import FindPageClient from "./findClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find by Scene",
  description: "Identify a movie or TV show from a scene, screenshot, or camera capture.",
  openGraph: {
    title: "Find by Scene | WatchedThis",
    description: "Identify a movie or TV show from a scene, screenshot, or camera capture.",
    url: "https://www.WatchedThis.com/find",
  },
};

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FindPageClient />
      <SceneDetect />
    </Suspense>
  );
}