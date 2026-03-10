import { Suspense } from "react";
import SceneDetect from "../components/sceneDetection/sceneCamera";
import FindPageClient from "./findClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FindPageClient />
      <SceneDetect />;
    </Suspense>
  );
}