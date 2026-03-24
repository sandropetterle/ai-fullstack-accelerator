export type ArticleStatus = 'Draft' | 'Published' | 'Archived'

export type ArticleCategory =
  | 'General'
  | 'Tutorial'
  | 'Guide'
  | 'Reference'
  | 'News'

export type Article = {
  id: string
  title: string
  slug: string
  shortDescription: string
  fullContent?: string
  category: ArticleCategory
  tags: string[]
  author?: string
  createdDate: string
  updatedDate: string
  voteCount: number
  status: ArticleStatus
  isFeatured?: boolean
  isTrending?: boolean
}

export type ArticleListItem = Omit<Article, 'fullContent'>

export type SortOption = 'recent' | 'votes' | 'alphabetical'
