import Link from 'next/link'
import { Article } from '@/lib/types/article'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart } from 'lucide-react'

type RelatedArticlesSectionProps = {
  articles: Article[]
  title?: string
  noRelatedMessage?: string
}

export function RelatedArticlesSection({
  articles,
  title = 'Related Articles',
  noRelatedMessage = 'No related articles found',
}: RelatedArticlesSectionProps) {
  if (articles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {noRelatedMessage}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.slug}`}
            className="block group"
          >
            <div className="space-y-2">
              <h4 className="font-medium leading-tight group-hover:text-primary transition-colors">
                {article.title}
              </h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {article.category}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className="h-3 w-3" />
                  <span>{article.voteCount}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
