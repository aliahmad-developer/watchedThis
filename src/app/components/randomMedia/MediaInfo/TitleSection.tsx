interface TitleSectionProps {
  title: string;
  certification?: string;
  tagline?: string;
  primaryClass?: string;
  secondaryClass?: string;
}

export default function TitleSection({
  title,
  certification,
  tagline,
  primaryClass = "text-white",
  secondaryClass = "text-white/75",
}: TitleSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {certification?.trim() && (
          <span className={`border border-current bg-transparent inline-block px-2 py-1 rounded text-xs font-semibold opacity-75 ${primaryClass}`}>
            {certification}
          </span>
        )}
        <h1 className={`text-4xl font-bold p-1 ${primaryClass}`}>
          {title}
        </h1>
      </div>
      {tagline?.trim() && (
        <p className={`text-lg ${secondaryClass}`}>
          {tagline}
        </p>
      )}
    </div>
  );
}