import Link from "next/link";

interface Company {
  id: number;
  name: string | null;
}

interface ProductionListProps {
  companies?: Company[];
  primaryClass?: string;
  secondaryClass?: string;
}

export function ProductionList({
  companies,
  primaryClass = "text-white",
  secondaryClass = "text-white/75",
}: ProductionListProps) {
  const filtered = companies?.filter((c) => c.name?.trim()) ?? [];

  if (filtered.length === 0) {
    return <p className={secondaryClass}>N/A</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-y-1 gap-x-4">
      {filtered.map((c) => (
        <li key={c.id} className="flex items-center">
          <Link
            href={`/production/${c.id}`}
            title={c.name ?? "Unknown"}
            className={`transition-colors hover:text-light-accent dark:hover:text-dark-accent ${primaryClass}`}
          >
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}