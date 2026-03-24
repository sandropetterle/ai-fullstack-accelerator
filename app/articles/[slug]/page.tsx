import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArticleBySlug, getArticles, getRelatedArticles } from '@/lib/api/articles'
import { formatDate } from '@/lib/utils/dateFormat'
import dynamic from 'next/dynamic'
import { Breadcrumb } from '@/components/articles/details/Breadcrumb'
import { VotingButton } from '@/components/articles/details/VotingButton'

const ArticleContent = dynamic(
  () => import('@/components/articles/details/ArticleContent').then(mod => ({ default: mod.ArticleContent })),
  { loading: () => <div className="h-64 animate-pulse rounded bg-muted" /> }
)
import { RelatedArticlesSection } from '@/components/articles/details/RelatedArticlesSection'
import { ArticleActions } from '@/components/articles/details/ArticleActions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { JsonLd } from '@/components/shared/JsonLd'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { RecentlyViewedTracker } from '@/components/articles/RecentlyViewedTracker'
import { getArticleDetailLabels } from '@/lib/cms/queries'

type PageProps = {
  params: Promise<{ slug: string }>
}

// Revalidate every 10 minutes
export const revalidate = 600

export async function generateStaticParams() {
  try {
    const response = await getArticles({ pageSize: 100 })
    return response.articles.map((article) => ({
      slug: article.slug,
    }))
  } catch (error) {
    // API not available during build (e.g., Docker build) - return empty array
    // Pages will be generated on-demand via ISR
    console.warn('Failed to fetch articles for static generation:', error)
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.',
    }
  }

  return {
    title: `${article.title} | AI Fullstack Accelerator`,
    description: article.shortDescription,
    keywords: [article.category, ...article.tags],
    openGraph: {
      title: article.title,
      description: article.shortDescription,
      type: 'article',
      publishedTime: article.createdDate,
      modifiedTime: article.updatedDate,
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.shortDescription,
    },
  }
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params
  const [article, labels, relatedArticles] = await Promise.all([
    getArticleBySlug(slug),
    getArticleDetailLabels(),
    getRelatedArticles(slug),
  ])

  if (!article) {
    notFound()
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Articles', href: '/articles' },
    { label: article.title, href: `/articles/${article.slug}` },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.shortDescription,
    author: {
      '@type': 'Person',
      name: article.author || 'Anonymous',
    },
    datePublished: article.createdDate,
    dateModified: article.updatedDate,
    keywords: article.tags.join(', '),
  }

  return (
    <>
      <RecentlyViewedTracker
        slug={article.slug}
        title={article.title}
        category={article.category}
      />
      <Breadcrumb items={breadcrumbs} ariaLabel={labels.breadcrumbAriaLabel} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="mb-6">
              <Badge className="mb-3">{article.category}</Badge>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                {article.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>By {article.author || 'Anonymous'}</span>
                <span>•</span>
                <span>{formatDate(article.createdDate)}</span>
                {article.updatedDate !== article.createdDate && (
                  <>
                    <span>•</span>
                    <span>Updated {formatDate(article.updatedDate)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Voting and Actions */}
            <div className="flex items-center gap-3 mb-6">
              <ErrorBoundary>
                <VotingButton
                  initialVoteCount={article.voteCount}
                  articleId={article.id}
                  votesLabel={labels.votesLabel}
                  voteAriaTemplate={labels.voteAriaTemplate}
                  voteAnnouncementTemplate={labels.voteAnnouncementTemplate}
                />
              </ErrorBoundary>
              <ArticleActions
                slug={article.slug}
                articleId={article.id}
                editLabel={labels.editLabel}
                deleteLabel={labels.deleteLabel}
                deleteDialogTitle={labels.deleteDialogTitle}
                deleteDialogDescription={labels.deleteDialogDescription}
                cancelLabel={labels.cancelLabel}
                deleteConfirmLabel={labels.deleteConfirmLabel}
                deletingLabel={labels.deletingLabel}
              />
            </div>

            {/* Full Content (Markdown) */}
            <Card>
              <CardContent className="pt-6">
                <ErrorBoundary>
                  {article.fullContent ? (
                    <ArticleContent content={article.fullContent} />
                  ) : (
                    <p className="text-muted-foreground">
                      {labels.noContentMessage ?? 'No content available for this article.'}
                    </p>
                  )}
                </ErrorBoundary>
              </CardContent>
            </Card>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - 1/3 width */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <RelatedArticlesSection
                articles={relatedArticles}
                title={labels.relatedArticlesTitle}
                noRelatedMessage={labels.noRelatedMessage}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* JSON-LD for SEO */}
      <JsonLd data={jsonLd} />
    </>
  )
}
