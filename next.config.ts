import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "satori"],

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
        source: "/og/",
        headers: [
          {
            key: "Content-Type",
            value: "image/png",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
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
  dangerouslyAllowLocalIP: true,

  formats: ["image/webp"],
  minimumCacheTTL: 60 * 60 * 24 * 31,

  deviceSizes: [640, 750, 828, 1080, 1200],
  imageSizes: [64, 128, 256, 500],

  qualities: [75],

  remotePatterns: [
    { protocol: "https", hostname: "lh3.googleusercontent.com" },

    {
      protocol: "https",
      hostname: "firebasestorage.googleapis.com",
    },

    {
      protocol: "https",
      hostname: "fyp-movie-4d46d.firebasestorage.app",
    },

    {
      protocol: "https",
      hostname: "image.tmdb.org",
      pathname: "/**",
    },

    {
      protocol: "http",
      hostname: "localhost",
      port: "3000",
      pathname: "/api/image-proxy/**",
    },

    {
      protocol: "https",
      hostname: "watchedthis.com",
      pathname: "/api/image-proxy/**",
    },
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
