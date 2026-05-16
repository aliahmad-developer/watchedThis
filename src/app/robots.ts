import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",

        allow: ["/"],

        disallow: [
          // Auth flows
          "/auth",
          "/auth/confirmed",
          "/reset-password",

          // User-private areas
          "/user",
          "/user/library",
          "/user/profile",

          // Internal APIs (keep targeted, not global block)
          "/api/auth",
          "/api/user",
          "/api/internal",

          // OG image route (IMPORTANT: single endpoint only)
          "/og",

          // Search / filtered results (thin pages)
          "/search",
          "/find/results",

          // Random/token pages (non-indexable)
          "/random",
          "/random/*",

          // Tooling pages
          "/sceneDetect",
        ],
      },
    ],

    sitemap: "https://watchedthis.com/sitemap.xml",
  };
}
