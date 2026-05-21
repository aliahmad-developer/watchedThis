// app/auth/page.tsx
import { Suspense } from "react";
import AuthPage from "../components/auth/authPage";

export default function Page() {
  return (
    <>
      <h1 className="sr-only">Authentication | WatchedThis</h1>
      <Suspense>
        <AuthPage />
      </Suspense>
    </>
  );
}
