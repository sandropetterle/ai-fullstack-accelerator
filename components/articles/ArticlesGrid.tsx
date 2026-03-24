import { Article } from '@/lib/types/article'
import { ArticleCard } from '@/components/home/ArticleCard'

type ArticlesGridProps = {
  articles: Article[]
}

export function ArticlesGrid({ articles }: ArticlesGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  )
}
