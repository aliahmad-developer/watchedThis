import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=*, microphone=()",
          },
        ],
      },
      {
        source: "/api/image-proxy/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          { key: "Vary", value: "Accept-Encoding" },
        ],
      },
      {
        source: "/api/dailyMedia",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, immutable",
          },
          { key: "Vary", value: "Accept-Encoding" },
        ],
      },
    ];
  },

  images: {
    unoptimized: true, // image-proxy route already handles resizing/caching; skip Next's optimizer entirely

    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/**" },
    ],
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@fortawesome/react-fontawesome",
      "@fortawesome/free-solid-svg-icons",
      "@fortawesome/free-brands-svg-icons",
      "framer-motion",
      "@heroicons/react",
    ],
  },
};

export default nextConfig;
