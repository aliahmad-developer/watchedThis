import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["image.tmdb.org"], // ✅ allow TMDb poster URLs
  },
};

export default nextConfig;
