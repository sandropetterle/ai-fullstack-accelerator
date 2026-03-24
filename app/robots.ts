import type { MetadataRoute } from 'next'

const PRODUCTION_URL = 'https://your-domain.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/login/'],
    },
    sitemap: `${PRODUCTION_URL}/sitemap.xml`,
  }
}
