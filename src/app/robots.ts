import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          // Auth & account flows — no SEO value, should never be indexed
          "/auth",
          "/auth/confirmed",
          "/reset-password",

          // Personal/gated user pages
          "/user",
          "/user/library",
          "/user/profile",

          // All API routes
          "/api/",

          // OG image generation endpoint
          "/og",

          // Query-driven results — Google skips these anyway, but be explicit
          "/find/results",
          "/search",

          // Tool pages with no unique indexable content
          "/sceneDetect",
        ],
      },
    ],
    sitemap: "https://watchedthis.com/sitemap.xml",
    host: "https://watchedthis.com",
  };
}