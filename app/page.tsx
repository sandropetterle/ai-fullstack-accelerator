import type { Metadata } from 'next'
import { Hero } from '@/components/home/Hero'
import { FeaturedArticles } from '@/components/home/FeaturedArticles'
import { StatsSection } from '@/components/home/StatsSection'
import { CTASection } from '@/components/home/CTASection'
import { getFeaturedArticles, getArticles, getArticleStats } from '@/lib/api/articles'
import { JsonLd } from '@/components/shared/JsonLd'
import { getHomePage } from '@/lib/cms/queries'
import type { CmsHeroBlock, CmsCtaBannerBlock, CmsStatsBarBlock, CmsFeaturedArticlesBlock } from '@/lib/cms/types'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Discover curated articles, tutorials, and guides. Browse featured content and join the community.',
}

// Revalidate every 5 minutes
export const revalidate = 300

export default async function HomePage() {
  // Fetch CMS content and API data in parallel
  const [homePage, featuredArticles, allArticlesResult] = await Promise.all([
    getHomePage(),
    getFeaturedArticles().catch(() => []),
    getArticles({ pageSize: 100 }).catch(() => ({ articles: [], total: 0 })),
  ])

  const stats = getArticleStats(allArticlesResult.articles)

  // Extract CMS blocks by type
  const content = homePage.content ?? []
  const heroBlock = content.find((b): b is CmsHeroBlock => b.__component === 'sections.hero')
  const statsBlock = content.find((b): b is CmsStatsBarBlock => b.__component === 'sections.stats-bar')
  const featuredBlock = content.find((b): b is CmsFeaturedArticlesBlock => b.__component === 'sections.featured-articles')
  const ctaBlock = content.find((b): b is CmsCtaBannerBlock => b.__component === 'sections.cta-banner')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AI Fullstack Accelerator',
    description: 'A fullstack accelerator for building AI-powered applications with modern web technologies.',
    url: 'https://your-domain.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://your-domain.com/articles?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <Hero
        heading={heroBlock?.heading}
        subheading={heroBlock?.subheading}
        primaryCTA={heroBlock?.primaryCTA}
        secondaryCTA={heroBlock?.secondaryCTA}
      />
      <FeaturedArticles
        articles={featuredArticles}
        heading={featuredBlock?.heading}
        subheading={featuredBlock?.subheading}
        viewAllLabel={featuredBlock?.viewAllLabel}
        mobileViewAllLabel={featuredBlock?.mobileViewAllLabel}
      />
      <StatsSection {...stats} statLabels={statsBlock?.stats} />
      <CTASection
        heading={ctaBlock?.heading}
        description={ctaBlock?.description}
        primaryCTA={ctaBlock?.primaryCTA}
        secondaryCTA={ctaBlock?.secondaryCTA}
      />
      <JsonLd data={jsonLd} />
    </>
  )
}
