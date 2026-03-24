import type { MetadataRoute } from 'next'
import { getArticles } from '@/lib/api/articles'

const PRODUCTION_URL = 'https://your-domain.com'

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: PRODUCTION_URL,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  },
  {
    url: `${PRODUCTION_URL}/articles`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const result = await getArticles({ pageSize: 100 })
    const articleRoutes: MetadataRoute.Sitemap = result.articles.map((article) => ({
      url: `${PRODUCTION_URL}/articles/${article.slug}`,
      lastModified: article.updatedDate ? new Date(article.updatedDate) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
    return [...STATIC_ROUTES, ...articleRoutes]
  } catch {
    // API unavailable — return static routes only
    return STATIC_ROUTES
  }
}
