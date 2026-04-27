import { Suspense } from "react";
import FindResultsClient from "./findResultClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={null}>
        <FindResultsClient />
      </Suspense>
    </div>
  );
}
