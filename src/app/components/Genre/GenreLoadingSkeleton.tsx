// components/genre/GenreLoadingSkeleton.tsx
"use client";

export function GenreLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-2">Loading genre information...</p>
      </div>
    </div>
  );
}