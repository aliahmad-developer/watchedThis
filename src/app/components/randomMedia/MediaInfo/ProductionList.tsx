import Link from "next/link";

interface ProductionListProps {
  companies?: { id: number; name: string | null }[]; // Added id
}

export function ProductionList({ companies }: ProductionListProps) {
  const filtered = companies?.filter((c) => c.name?.trim());

  if (!filtered?.length) return <li>N/A</li>;

  return (
    <ul className="grid grid-cols-2 gap-y-1 gap-x-4">
      {filtered.map((c, i) => (
        <li key={i} className="flex items-center">
          <Link href={`/production/${c.id}`}>
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
