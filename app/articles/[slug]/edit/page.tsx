import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'
import { hasRole } from '@/lib/types/auth'
import { getArticleBySlug } from '@/lib/api/articles'
import { ArticleForm } from '@/components/articles/ArticleForm'
import { Breadcrumb } from '@/components/articles/details/Breadcrumb'
import { getArticleFormLabels } from '@/lib/cms/queries'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `Edit Article | AI Fullstack Accelerator`,
    description: `Edit the article: ${slug}`,
  }
}

export default async function EditArticlePage({ params }: PageProps) {
  const [session, { slug }] = await Promise.all([auth(), params])

  if (!session) {
    redirect('/login')
  }

  if (!hasRole(session.user.roles, 'Editor')) {
    redirect('/articles')
  }

  const [article, labels] = await Promise.all([
    getArticleBySlug(slug),
    getArticleFormLabels(),
  ])

  if (!article) {
    notFound()
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Articles', href: '/articles' },
    { label: article.title, href: `/articles/${article.slug}` },
    { label: 'Edit', href: `/articles/${article.slug}/edit` },
  ]

  return (
    <>
      <Breadcrumb items={breadcrumbs} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
        <ArticleForm mode="edit" initialData={article} labels={labels} />
      </div>
    </>
  )
}
