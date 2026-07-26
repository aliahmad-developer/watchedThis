import { forwardRef } from "react";
import Image, { ImageProps } from "next/image";

export const TmdbImage = forwardRef<HTMLImageElement, ImageProps>(
  (props, ref) => <Image ref={ref} {...props} unoptimized />
);
TmdbImage.displayName = "TmdbImage";