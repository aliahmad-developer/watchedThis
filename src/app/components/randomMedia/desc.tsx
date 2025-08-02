import MediaPoster from "./mediaPoster";
import MediaInfo from "../randomMedia/MediaInfo/index";
import Image from "next/image";
import { useState } from "react";

interface DescProps {
  data: any;
  backdropUrl: string;
}

export default function Desc({ data, backdropUrl }: DescProps) {
  const [hasError, setHasError] = useState(false);
  const hasBackdrop =
    !!backdropUrl?.trim() && backdropUrl !== "undefined" && !hasError;

  return (
    <div className="relative w-full min-h-screen bg-gray-900">
      {" "}
      {/* Fallback dark bg */}
      {!hasBackdrop && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center px-2 text-center">
          <span className="text-gray-500 text-lg"></span>
        </div>
      )}
      {/* Backdrop with enhanced gradients */}
      <div className="absolute inset-0">
        {hasBackdrop && (
          <>
            <Image
              onContextMenu={(e) => e.preventDefault()}
              src={backdropUrl}
              alt=""
              fill
              className="object-cover select-none"
              quality={80}
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw"
              onError={() => setHasError(true)}
            />

            {/* Primary gradient overlay - dark at bottom fading up */}
            <div
              className="
              absolute inset-0 
              bg-gradient-to-t 
              from-gray-900 via-gray-900/80 to-transparent
              backdrop-blur-sm md:backdrop-blur
            "
            />

            {/* Secondary gradient overlay - accent tint at top */}
            <div
              className="
              absolute inset-0 
              bg-gradient-to-b 
              from-blue-500/10 via-transparent to-transparent
            "
            />

            {/* Optional: subtle vignette effect */}
            <div
              className="
              absolute inset-0 
              bg-radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.7))
            "
            />
          </>
        )}
      </div>
      {/* Content container */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 md:py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-12">
          <div className="w-full sm:w-4/5 md:w-3/5 lg:w-1/3 xl:w-1/4 mx-auto ">
            <MediaPoster data={data} />
          </div>

          <div className="w-full lg:w-2/3 xl:w-3/4">
            <MediaInfo data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
