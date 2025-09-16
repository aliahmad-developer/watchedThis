import Link from "next/link";

interface Company {
  id: number;
  name: string | null;
}

interface ProductionListProps {
  companies?: Company[];
}

export function ProductionList({ companies }: ProductionListProps) {
  const filtered = companies?.filter((c) => c.name?.trim()) ?? [];

  if (filtered.length === 0) {
    return <p className="text-light-card dark:text-dark-card">N/A</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-y-1 gap-x-4">
      {filtered.map((c) => (
        <li
          key={c.id}
          className="flex items-center text-light-card hover:text-light-accent dark:hover:text-dark-accent transition-colors"
        >
          <Link href={`/production/${c.id}`} title={c.name ?? "Unknown"}>
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
