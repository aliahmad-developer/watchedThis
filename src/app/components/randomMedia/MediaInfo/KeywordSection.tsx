"use client";

import { useState, useEffect } from "react";

interface Keyword {
  id: number;
  name: string;
}

interface KeywordsSectionProps {
  keywords?: Keyword[];
}

// How many keywords to show per breakpoint
const getLimit = () => {
  const w = window.innerWidth;
  if (w < 640) return 5;   // mobile
  if (w < 1024) return 10; // tablet
  return 16;               // desktop
};

export default function KeywordsSection({ keywords }: KeywordsSectionProps) {
  const list: Keyword[] = keywords ?? [];
  const [limit, setLimit] = useState(16); // SSR-safe default

  useEffect(() => {
    const update = () => setLimit(getLimit());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const visible = list.slice(0, limit);
  const remaining = list.length - visible.length;

  if (!list.length) return null;

  return (
    <div className="col-span-2">
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {visible.map((kw) => (
          <span
            key={kw.id}
            className="text-white/60 text-[10px] sm:text-xs font-mono tracking-tight"
          >
            #{kw.name.toLowerCase().replace(/\s+/g, "-")}
          </span>
        ))}
        {remaining > 0 && (
          <span className="text-white/30 text-[10px] sm:text-xs font-mono tracking-tight">
            +{remaining} more
          </span>
        )}
      </div>
    </div>
  );
}