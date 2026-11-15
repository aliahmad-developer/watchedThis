import { expect, test } from "playwright/test";

const META_HEADERS = {
  Host: "watchedthis.com",
  "User-Agent":
    "Mozilla/5.0 (compatible; meta-externalagent/1.1; +https://developers.facebook.com/docs/sharing/webmasters/crawler)",
};

test("Meta can read public pages but cannot bypass protected routes", async ({ request }) => {
  const publicPage = await request.get("/", { headers: META_HEADERS });
  expect(publicPage.status()).toBe(200);

  const protectedPage = await request.get("/user/library", {
    headers: META_HEADERS,
    maxRedirects: 0,
  });
  expect(protectedPage.status()).toBe(307);
  expect(protectedPage.headers().location).toContain("/user/profile");

  const genericScraper = await request.get("/", {
    headers: {
      Host: "watchedthis.com",
      "User-Agent": "python-requests/2.32",
    },
  });
  expect(genericScraper.status()).toBe(403);
});

test("dynamic social metadata uses direct, reachable TMDB images", async ({ request }) => {
  for (const path of [
    "/movie/project-hail-mary/687163",
    "/person/tom-hanks/31",
    "/production/420",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    expect(html, path).not.toContain("/api/image-proxy/?url=");

    const ogTag = (html.match(/<meta[^>]+>/g) ?? []).find((tag) =>
      tag.includes('property="og:image"'),
    );
    const imageUrl = ogTag?.match(/content="([^"]+)"/)?.[1];
    expect(imageUrl, path).toMatch(/^https:\/\/image\.tmdb\.org\/t\/p\//);

    const image = await request.get(imageUrl!);
    expect(image.status(), `${path} social image`).toBe(200);
    expect(image.headers()["content-type"]).toMatch(/^image\//);
  }
});
