import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/echo', '/find', '/random', '/spinner'],
        disallow: ['/user', '/api/', '/_next/', '/admin'],
      },
    ],
    sitemap: 'https://watchedthis.com/sitemap.xml',
    host: 'https://watchedthis.com',
  }
}