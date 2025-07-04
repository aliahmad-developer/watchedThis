import TitleSection from "./TitleSection";
import ActionButtons from "./ActionButtons";
import OverviewSection from "./OverviewSection";
import MediaDetailsGrid from "./MediaDetailsGrid";

interface MediaInfoProps {
  data: any;
}

export default function MediaInfo({ data }: MediaInfoProps) {
  const displayTitle = data.title || data.name || "Untitled";
  const overview = data.overview || "No overview available.";

  return (
    <div className="flex flex-col gap-8 text-light-body-text dark:text-dark-body-text">
      <TitleSection
        title={displayTitle}
        certification={data.certification}
        tagline={data.tagline}
      />
      <div className="flex flex-col lg:flex-row gap-10 w-full">
        <div className="flex-1 space-y-6">
          <ActionButtons />
          <OverviewSection overview={overview} />
        </div>
        <div className="flex-1">
          <MediaDetailsGrid data={data} displayTitle={displayTitle} />
        </div>
      </div>
    </div>
  );
}
