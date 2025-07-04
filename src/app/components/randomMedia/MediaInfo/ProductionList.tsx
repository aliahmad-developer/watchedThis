interface ProductionListProps {
  companies?: { name: string | null }[];
}

export function ProductionList({ companies }: ProductionListProps) {
  const filtered = companies?.filter((c) => c.name?.trim());

  if (!filtered?.length) return <li>N/A</li>;

  return (
    <ul className="grid grid-cols-2 gap-y-1 gap-x-4">
      {filtered.map((c, i) => (
        <li key={i} className="flex items-center">
          {c.name}
        </li>
      ))}
    </ul>
  );
}
