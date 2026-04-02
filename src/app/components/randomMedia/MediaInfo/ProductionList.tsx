import Link from "next/link";
import { useState } from "react";
import type { AmbientTextColors } from "../detailsPage";

interface Company {
  id: number;
  name: string | null;
}

interface ProductionListProps {
  companies?: Company[];
  ambientText: AmbientTextColors;
}

function ProductionLink({ company, ambientText }: { company: Company; ambientText: AmbientTextColors }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/production/${company.id}`}
      title={company.name ?? "Unknown"}
      className="transition-all duration-200"
      style={{
        color: hovered ? ambientText.primary : ambientText.secondary,
        textDecoration: hovered ? "underline" : "none",
        textUnderlineOffset: "3px",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {company.name}
    </Link>
  );
}

export function ProductionList({ companies, ambientText }: ProductionListProps) {
  const [showAllHidden, setShowAllHidden] = useState(false);
  const filtered = companies?.filter((c) => c.name?.trim()) ?? [];

  if (filtered.length === 0) {
    return (
      <p className="transition-colors duration-700" style={{ color: ambientText.secondary }}>
        N/A
      </p>
    );
  }

  const displayList = showAllHidden ? filtered : filtered.slice(0, 6);
  const showMore = filtered.length > 6;

  return (
    <div className="relative">
      <ul className="grid grid-cols-2 gap-y-1 gap-x-4">
        {displayList.map((c) => (
          <li key={c.id} className="flex items-center">
            <ProductionLink company={c} ambientText={ambientText} />
          </li>
        ))}
      </ul>
      {showMore && (
        <div className="mt-1">
          <button
            onClick={() => setShowAllHidden(!showAllHidden)}
            className="text-xs underline" 
            style={{ color: ambientText.muted }}
          >
            {showAllHidden ? 'Show less' : `+${filtered.length - 6} more`}
          </button>
          {showAllHidden && (
            <ul className="mt-1 grid grid-cols-2 gap-y-1 gap-x-4 absolute z-10 bg-white/90 dark:bg-black/90 backdrop-blur-sm border rounded p-2 shadow-lg w-full left-0 top-full">
              {filtered.slice(6).map((c) => (
                <li key={c.id} className="flex items-center">
                  <ProductionLink company={c} ambientText={ambientText} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
