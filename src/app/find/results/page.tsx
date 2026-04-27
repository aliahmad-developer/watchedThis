import { Suspense } from "react";
import FindResultsClient from "./findResultClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <div className="min-h-screen">
      <FindResultsClient />
      </div>
    </Suspense>
  );
}