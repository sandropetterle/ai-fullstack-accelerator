import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { hasRole } from '@/lib/types/auth'
import { ArticleForm } from '@/components/articles/ArticleForm'
import { Breadcrumb } from '@/components/articles/details/Breadcrumb'
import { getArticleFormLabels } from '@/lib/cms/queries'

export const metadata: Metadata = {
  title: 'New Article | AI Fullstack Accelerator',
  description: 'Create a new article.',
}

export default async function NewArticlePage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (!hasRole(session.user.roles, 'Editor')) {
    redirect('/articles')
  }

  const labels = await getArticleFormLabels()

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Articles', href: '/articles' },
    { label: 'New Article', href: '/articles/new' },
  ]

  return (
    <>
      <Breadcrumb items={breadcrumbs} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
        <ArticleForm mode="create" labels={labels} />
      </div>
    </>
  )
}
