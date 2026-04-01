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
  const filtered = companies?.filter((c) => c.name?.trim()).slice(0, 8) ?? [];

  if (filtered.length === 0) {
    return (
      <p className="transition-colors duration-700" style={{ color: ambientText.secondary }}>
        N/A
      </p>
    );
  }

  if (filtered.length > 0) {
    const showMore = filtered.length > 6;
    return (
      <div className="max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-ambient-muted scrollbar-track-transparent pr-2">
        <ul className="grid grid-cols-2 gap-y-1 gap-x-4 -mr-2">
          {filtered.slice(0, showMore ? 6 : filtered.length).map((c) => (
            <li key={c.id} className="flex items-center">
              <ProductionLink company={c} ambientText={ambientText} />
            </li>
          ))}
          {showMore && (
            <li className="flex items-center col-span-2 text-sm" style={{ color: ambientText.muted }}>
              +{filtered.length - 6} more production companies
            </li>
          )}
        </ul>
      </div>
    );
  }
}