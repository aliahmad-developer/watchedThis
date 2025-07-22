import Link from "next/link";

interface GenreTagsProps {
  genres?: { id: number; name: string }[];
}

export default function GenreTags({ genres }: GenreTagsProps) {
  if (!genres?.length) return <span>N/A</span>;

  return (
    <div className="flex flex-wrap mt-1 mb-1">
      {genres.map((genre) => (
        <Link
          key={genre.name}
          href={`/genre/${genre.id}-${genre.name
            .toLowerCase()
            .replace(/\s+/g, "-")}`}
          scroll={false}
          className="m-1 mr-1 text-light-accent dark:text-dark-accent bg-light-card dark:bg-dark-card px-3 py-1 rounded-full text-sm border border-light-border dark:border-dark-border hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg hover:text-light-btn-hover-text dark:hover:text-dark-btn-hover-text cursor-pointer transition-colors"
        >
          {genre.name}
        </Link>
      ))}
    </div>
  );
}
