interface GenreTagsProps {
  genres?: { name: string }[];
}

export function GenreTags({ genres }: GenreTagsProps) {
  if (!genres?.length) return <span>N/A</span>;

  return (
    <div className="flex flex-wrap mt-1 mb-1 gap-2">
      {genres.map((genre) => (
        <span
          key={genre.name}
          className="text-light-accent dark:text-dark-accent bg-light-card dark:bg-dark-card px-3 py-1 rounded-full text-sm border border-light-border dark:border-dark-border"
        >
          {genre.name}
        </span>
      ))}
    </div>
  );
}
