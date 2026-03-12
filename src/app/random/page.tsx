"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createSlug } from "../components/utilities/createSlug";
import DiceRoll from "./[media_type]/[media_name_slug]/[id]/diceRoll";

export default function RandomPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Reset state each time this page mounts / pathname is /random
    setError(null);
    setFinishing(false);

    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchRandomMedia = async () => {
      try {
        const response = await fetch("/api/randomCall", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        if (!data.media_type || !data.id)
          throw new Error("Invalid data format from API");

        const mediaTitle = data.title || data.name || "";

        setFinishing(true);
        setTimeout(() => {
          router.push(
            `/random/${data.media_type}/${createSlug(mediaTitle)}/${data.id}`
          );
        }, 700);
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // navigated away — ignore
        console.error("Failed to fetch random media:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    fetchRandomMedia();

    return () => {
      controller.abort();
    };
  }, [pathname]); // re-run every time the user lands on /random

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <h1 className="text-2xl font-bold text-light-accent dark:text-dark-accent">
          Error
        </h1>
        <p className="text-center">{error}</p>
        <button
          onClick={() => {
            setError(null);
            router.push("/random");
          }}
          className="px-4 py-2 text-white rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <DiceRoll finishing={finishing} />
    </div>
  );
}