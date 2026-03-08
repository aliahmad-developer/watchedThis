import { Suspense } from "react";
import FindPageClient from "./findClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FindPageClient />
    </Suspense>
  );
}