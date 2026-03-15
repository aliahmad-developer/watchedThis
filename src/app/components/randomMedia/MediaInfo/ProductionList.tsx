import Link from "next/link";
import type { AmbientTextColors } from "../detailsPage";

interface Company {
  id: number;
  name: string | null;
}

interface ProductionListProps {
  companies?: Company[];
  ambientText: AmbientTextColors;
}

export function ProductionList({ companies, ambientText }: ProductionListProps) {
  const filtered = companies?.filter((c) => c.name?.trim()) ?? [];

  if (filtered.length === 0) {
    return (
      <p
        className="transition-colors duration-700"
        style={{ color: ambientText.secondary }}
      >
        N/A
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-y-1 gap-x-4">
      {filtered.map((c) => (
        <li key={c.id} className="flex items-center">
          <Link
            href={`/production/${c.id}`}
            title={c.name ?? "Unknown"}
            className="transition-colors duration-700 hover:text-light-accent dark:hover:text-dark-accent"
            style={{ color: ambientText.primary }}
          >
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}