'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { hasRole } from '@/lib/types/auth'
import { createArticle, updateArticle } from '@/lib/api/articles'
import type { Article, ArticleCategory } from '@/lib/types/article'
import type { CmsArticleFormLabels } from '@/lib/cms/types'

const CATEGORIES: ArticleCategory[] = [
  'General',
  'Tutorial',
  'Guide',
  'Reference',
  'News',
]

const MAX_TAGS = 10

function generateSlugPreview(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

type FormErrors = {
  title?: string
  shortDescription?: string
  fullContent?: string
  author?: string
  tags?: string
}

type ArticleFormProps = {
  mode: 'create' | 'edit'
  initialData?: Article
  labels?: CmsArticleFormLabels
}

export function ArticleForm({ mode, initialData, labels: l }: ArticleFormProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = hasRole(session?.user?.roles, 'Admin')

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [shortDescription, setShortDescription] = useState(
    initialData?.shortDescription ?? ''
  )
  const [category, setCategory] = useState<ArticleCategory>(
    initialData?.category ?? 'General'
  )
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [fullContent, setFullContent] = useState(initialData?.fullContent ?? '')
  const [author, setAuthor] = useState(initialData?.author ?? '')
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false)
  const [isTrending, setIsTrending] = useState(initialData?.isTrending ?? false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const slugPreview = generateSlugPreview(title)

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!title.trim()) newErrors.title = 'Title is required'
    else if (title.length > 255)
      newErrors.title = 'Title must be 255 characters or less'
    if (!shortDescription.trim())
      newErrors.shortDescription = 'Short description is required'
    else if (shortDescription.length > 500)
      newErrors.shortDescription = 'Short description must be 500 characters or less'
    if (fullContent.length > 50000)
      newErrors.fullContent = 'Content must be 50,000 characters or less'
    if (author.length > 100)
      newErrors.author = 'Author must be 100 characters or less'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function addTag() {
    const tag = tagInput.trim()
    if (!tag) return
    if (tags.includes(tag)) {
      setTagInput('')
      return
    }
    if (tags.length >= MAX_TAGS) {
      setErrors((prev) => ({ ...prev, tags: `Maximum ${MAX_TAGS} tags allowed` }))
      return
    }
    if (tag.length > 50) {
      setErrors((prev) => ({ ...prev, tags: 'Tag must be 50 characters or less' }))
      return
    }
    setTags((prev) => [...prev, tag])
    setTagInput('')
    setErrors((prev) => {
      const e = { ...prev }
      delete e.tags
      return e
    })
  }

  function removeTag(tagToRemove: string) {
    setTags((prev) => prev.filter((t) => t !== tagToRemove))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const token = session?.accessToken
      if (mode === 'create') {
        const created = await createArticle(
          {
            title,
            shortDescription,
            fullContent: fullContent || undefined,
            category,
            tags,
            author: author || undefined,
          },
          token
        )
        toast.success('Article created successfully')
        router.push(`/articles/${created.slug}`)
      } else if (initialData) {
        const updated = await updateArticle(
          initialData.id,
          {
            title,
            shortDescription,
            fullContent: fullContent || undefined,
            category,
            tags,
            author: author || undefined,
            isFeatured,
            isTrending,
          },
          token
        )
        toast.success('Article updated successfully')
        router.push(`/articles/${updated.slug}`)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save article'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={mode === 'create' ? 'Create article form' : 'Edit article form'}
    >
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? (l?.createTitle ?? 'New Article') : (l?.editTitle ?? 'Edit Article')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{l?.titleLabel ?? 'Title *'}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (!title.trim())
                  setErrors((prev) => ({ ...prev, title: 'Title is required' }))
                else
                  setErrors((prev) => {
                    const e = { ...prev }
                    delete e.title
                    return e
                  })
              }}
              placeholder={l?.titlePlaceholder ?? 'e.g. Getting Started with Clean Architecture'}
              maxLength={255}
              aria-required="true"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {slugPreview && (
              <p className="text-xs text-muted-foreground">
                {(l?.slugPreviewTemplate ?? 'Slug preview: {slug}').replace('{slug}', slugPreview)}
              </p>
            )}
            {errors.title && (
              <p id="title-error" className="text-sm text-destructive" role="alert">
                {errors.title}
              </p>
            )}
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="shortDescription">{l?.shortDescLabel ?? 'Short Description *'}</Label>
            <Textarea
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              onBlur={() => {
                if (!shortDescription.trim())
                  setErrors((prev) => ({
                    ...prev,
                    shortDescription: 'Short description is required',
                  }))
                else
                  setErrors((prev) => {
                    const e = { ...prev }
                    delete e.shortDescription
                    return e
                  })
              }}
              placeholder={l?.shortDescPlaceholder ?? 'A brief summary of the article (shown in listings)'}
              rows={3}
              maxLength={500}
              aria-required="true"
              aria-invalid={!!errors.shortDescription}
              aria-describedby={
                errors.shortDescription ? 'shortDescription-error' : undefined
              }
            />
            <p className="text-xs text-muted-foreground text-right">
              {shortDescription.length}/500
            </p>
            {errors.shortDescription && (
              <p
                id="shortDescription-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.shortDescription}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">{l?.categoryLabel ?? 'Category *'}</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ArticleCategory)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder={l?.categoryPlaceholder ?? 'Select a category'} />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tag-input">{l?.tagsLabel ?? 'Tags'}</Label>
            <div className="flex gap-2">
              <Input
                id="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder={l?.tagPlaceholder ?? 'Add a tag and press Enter'}
                maxLength={50}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                {l?.addTagLabel ?? 'Add'}
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {(l?.tagCountTemplate ?? '{count}/{max} tags')
                .replace('{count}', String(tags.length))
                .replace('{max}', String(MAX_TAGS))}
            </p>
            {errors.tags && (
              <p className="text-sm text-destructive" role="alert">{errors.tags}</p>
            )}
          </div>

          {/* Full Content */}
          <div className="space-y-2">
            <Label htmlFor="fullContent">{l?.contentLabel ?? 'Full Content (Markdown)'}</Label>
            <Textarea
              id="fullContent"
              value={fullContent}
              onChange={(e) => setFullContent(e.target.value)}
              placeholder={l?.contentPlaceholder ?? 'Write the full article content in Markdown...'}
              rows={20}
              className="font-mono text-sm"
              aria-invalid={!!errors.fullContent}
              aria-describedby={errors.fullContent ? 'fullContent-error' : undefined}
            />
            {errors.fullContent && (
              <p id="fullContent-error" className="text-sm text-destructive" role="alert">
                {errors.fullContent}
              </p>
            )}
          </div>

          {/* Author */}
          <div className="space-y-2">
            <Label htmlFor="author">{l?.authorLabel ?? 'Author'}</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={l?.authorPlaceholder ?? 'Your name (optional)'}
              maxLength={100}
            />
            {errors.author && (
              <p className="text-sm text-destructive" role="alert">{errors.author}</p>
            )}
          </div>

          {/* Admin-only: Featured and Trending (edit mode only) */}
          {mode === 'edit' && isAdmin && (
            <div className="space-y-3 pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground pt-2">
                {l?.adminSettingsLabel ?? 'Admin Settings'}
              </p>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFeatured"
                  checked={isFeatured}
                  onCheckedChange={(checked) => setIsFeatured(!!checked)}
                />
                <Label htmlFor="isFeatured">{l?.featuredLabel ?? 'Featured article'}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isTrending"
                  checked={isTrending}
                  onCheckedChange={(checked) => setIsTrending(!!checked)}
                />
                <Label htmlFor="isTrending">{l?.trendingLabel ?? 'Trending article'}</Label>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              {l?.cancelLabel ?? 'Cancel'}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === 'create'
                  ? (l?.creatingLabel ?? 'Creating...')
                  : (l?.savingLabel ?? 'Saving...')
                : mode === 'create'
                ? (l?.createLabel ?? 'Create Article')
                : (l?.saveLabel ?? 'Save Changes')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
