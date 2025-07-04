interface TitleSectionProps {
  title: string;
  certification?: string;
  tagline?: string;
}

export default function TitleSection({
  title,
  certification,
  tagline,
}: TitleSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {certification?.trim() && (
          <span className="border-1 border-grey bg-transparent inline-block px-2 py-1 rounded text-light-accent text-xs font-semibold dark:text-dark-accent">
            {certification}
          </span>
        )}
        <h1 className="text-4xl font-bold p-1 text-light-bg dark:text-dark-header">
          {title}
        </h1>
      </div>
      {tagline?.trim() && (
        <p className="text-lg text-light-secondary-text dark:text-dark-secondary-text">
          {tagline}
        </p>
      )}
    </div>
  );
}
