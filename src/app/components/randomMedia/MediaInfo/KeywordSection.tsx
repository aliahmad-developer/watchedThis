"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Keyword {
  id: number;
  name: string;
}

interface KeywordsSectionProps {
  keywords?: Keyword[];
  textScheme?: "light" | "dark";
  mutedColor?: string;
}

const getLimit = () => {
  const w = window.innerWidth;
  if (w < 640) return 5;
  if (w < 1024) return 10;
  return 16;
};

export default function KeywordsSection({ keywords, textScheme = "light", mutedColor }: KeywordsSectionProps) {
  const list: Keyword[] = keywords ?? [];
  const [limit, setLimit] = useState(16);
  const router = useRouter();

  useEffect(() => {
    const update = () => setLimit(getLimit());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const visible = list.slice(0, limit);
  const remaining = list.length - visible.length;

  if (!list.length) return null;

  const kwStyle = mutedColor ? { color: mutedColor } : undefined;
  const kwFallback = !mutedColor ? (textScheme === "light" ? "text-white/60" : "text-gray-500") : "";
  const remainingStyle = mutedColor
    ? { color: mutedColor.replace(/[\d.]+\)$/, "0.40)") }
    : undefined;
  const remainingFallback = !mutedColor
    ? (textScheme === "light" ? "text-white/30" : "text-gray-400")
    : "";

 const handleClick = (name: string) => {
  router.push(`/search?keyword=${encodeURIComponent(name)}`);
};
  return (
    <div className="col-span-2">
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {visible.map((kw) => (
          <span
            key={kw.id}
            onClick={() => handleClick(kw.name)}
            className={`text-[10px] sm:text-xs font-mono tracking-tight transition-colors duration-700 cursor-pointer hover:opacity-100 opacity-80 ${kwFallback}`}
            style={kwStyle}
          >
            #{kw.name.toLowerCase().replace(/\s+/g, "-")}
          </span>
        ))}
        {remaining > 0 && (
          <span
            className={`text-[10px] sm:text-xs font-mono tracking-tight transition-colors duration-700 ${remainingFallback}`}
            style={remainingStyle}
          >
            +{remaining} more
          </span>
        )}
      </div>
    </div>
  );
}