"use client";
import { Suspense } from "react";
import AuthPage from "../../components/auth/authPage";

export default function ProfilePage() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        <Suspense>
          <AuthPage />
        </Suspense>
      </div>
    </div>
  );
}
