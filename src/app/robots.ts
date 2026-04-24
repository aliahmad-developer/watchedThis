import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/echo",
          "/find",
          "/random",
          "/spinner",
          "/about",
          "/terms",
          "/privacy",
          "/movie/",
          "/tv/",
          "/person/",
          "/genre/",
          "/production-company/",
          "/_next/static/", 
        ],
        disallow: [
          "/user",
          "/api/",
          "/admin",
          "/private/",
        ],
        crawlDelay: 1,
      },
    ],
    sitemap: "https://watchedthis.com/sitemap.xml",
    host: "https://watchedthis.com",
  };
}