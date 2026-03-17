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
  const filtered = companies?.filter((c) => c.name?.trim()) ?? [];

  if (filtered.length === 0) {
    return (
      <p className="transition-colors duration-700" style={{ color: ambientText.secondary }}>
        N/A
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-y-1 gap-x-4">
      {filtered.map((c) => (
        <li key={c.id} className="flex items-center">
          <ProductionLink company={c} ambientText={ambientText} />
        </li>
      ))}
    </ul>
  );
}