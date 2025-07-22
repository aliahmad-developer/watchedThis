import MediaPoster from "../randomMedia/mediaPoster"; // Adjust path if needed

interface MediaCardProps {
  item: {
    id: number;
    title?: string;
    name?: string;
    poster_path?: string;
    media_type?: string;
  };
  onClick: () => void;
}

export default function MediaCard({ item, onClick }: MediaCardProps) {
  const title = item.title || item.name || "Untitled";

  return (
    <div className="p-2">
      <div
        onClick={onClick}
        className="group cursor-pointer rounded-xl overflow-hidden"
      >
        {/* Fixed aspect ratio wrapper to avoid growth pushing layout */}
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl">
          <div className="absolute inset-0 transition-transform duration-200 group-hover:scale-[1.03] transform-gpu will-change-transform">
            <MediaPoster data={item} />
          </div>
        </div>

        <div className="mt-2 text-sm font-semibold text-center line-clamp-2 break-words">
          {title}
        </div>
      </div>
    </div>
  );
}
