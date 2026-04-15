import type { NextConfig } from "next";

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
        source: "/og",
        headers: [
          {
            key: "Content-Type",
            value: "image/png",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=604800",
          },
          {
            key: "Vercel-CDN-Cache-Control",
            value: "public, max-age=604800",
          },
        ],
      },
    ];
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 31,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [64, 128, 256, 500],
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "fyp-movie-4d46d.firebasestorage.app" },
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

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.watchedthis.com" }],
        destination: "https://watchedthis.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
