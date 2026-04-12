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
  if (typeof window === "undefined") return 16;
  const w = window.innerWidth;
  if (w < 640) return 5;
  if (w < 1024) return 10;
  return 16;
};

export default function KeywordsSection({
  keywords,
  textScheme = "light",
  mutedColor,
}: KeywordsSectionProps) {
  const list: Keyword[] = keywords ?? [];
  const [limit, setLimit] = useState(16);
  const router = useRouter();

  useEffect(() => {
    const update = () => setLimit(getLimit());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!list.length) return null;

  const visible = list.slice(0, limit);
  const hidden = list.slice(limit);

  const baseColor = mutedColor ?? (textScheme === "light" ? "rgba(255,255,255,0.75)" : "rgba(80,80,90,1)");
  const hoverColor = textScheme === "light" ? "rgba(255,255,255,1)" : "rgba(30,30,35,1)";
  const moreColor = mutedColor
    ? mutedColor.replace(/[\d.]+\)$/, "0.4)")
    : textScheme === "light"
    ? "rgba(255,255,255,0.35)"
    : "rgba(100,100,110,1)";

  const handleClick = (name: string) => {
    router.push(`/search?keyword=${encodeURIComponent(name)}`);
  };

  return (
    <div className="col-span-2">
      <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
        {visible.map((kw) => (
          <span
            key={kw.id}
            onClick={() => handleClick(kw.name)}
            className="text-[10px] sm:text-xs font-mono tracking-tight cursor-pointer transition-all duration-200"
            style={{ color: baseColor }}
            onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
            onMouseLeave={(e) => (e.currentTarget.style.color = baseColor)}
          >
            #{kw.name.toLowerCase().replace(/\s+/g, "-")}
          </span>
        ))}

        {hidden.length > 0 && (
          <span
            className="text-[10px] sm:text-xs font-mono tracking-tight"
            style={{ color: moreColor }}
          >
            +{hidden.length} more
          </span>
        )}
      </div>
    </div>
  );
}