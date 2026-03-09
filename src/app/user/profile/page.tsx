"use client";
import AuthPage from "../../components/auth/authPage";

export default function ProfilePage() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        <AuthPage />
      </div>
    </div>
  );
}