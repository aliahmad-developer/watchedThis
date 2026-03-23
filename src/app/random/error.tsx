"use client";
import { useRouter } from "next/navigation";

export default function RandomError({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <h1 className="text-2xl font-bold text-light-accent dark:text-dark-accent">
        Something went wrong
      </h1>
      <button
        onClick={() => router.push(`/random?ts=${Date.now()}`)}
        className="px-4 py-2 text-white rounded"
      >
        Try Again
      </button>
    </div>
  );
}