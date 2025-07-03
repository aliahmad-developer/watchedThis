import MediaPoster from "./mediaPoster";
import MediaInfo from "./mediaInfo";
import Image from "next/image";

interface DescProps {
  data: any;
  backdropUrl: string;
}

export default function Desc({ data, backdropUrl }: DescProps) {
  return (
    <div className="relative w-full min-h-screen bg-[var(--color-dark-bg)]">
      {/* Backdrop with blurry gradient overlay */}
      <div className="absolute inset-0">
        {backdropUrl && (
          <>
            <Image
              src={backdropUrl}
              alt=""
              fill
              className="object-cover"
              quality={80}
              priority
            />
            {/* Gradient overlay using your color variables */}
            <div className={`
              absolute inset-0 
              bg-gradient-to-t 
              from-dark-bg
              via-dark-bg/80 
              to-transparent 
              backdrop-blur-sm
            `} />
            <div className={`
              absolute inset-0 
              bg-gradient-to-b 
              from-dark-accent/20 
              via-transparent 
              to-transparent
            `} />
          </>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Poster - taking less width */}
          <div className="w-full lg:w-1/4">
            <MediaPoster data={data} />
          </div>
          
          {/* Info - more width for better text flow */}
          <div className="w-full lg:w-3/4">
            <MediaInfo data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}