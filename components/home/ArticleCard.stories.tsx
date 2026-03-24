import type { Meta, StoryObj } from '@storybook/react'
import { ArticleCard } from './ArticleCard'
import {
  MOCK_ARTICLE,
  MOCK_ARTICLE_GUIDE,
  MOCK_ARTICLE_REFERENCE,
} from '../../.storybook/fixtures'

const meta: Meta<typeof ArticleCard> = {
  title: 'Home/ArticleCard',
  component: ArticleCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ArticleCard>

export const Tutorial: Story = {
  args: { article: MOCK_ARTICLE },
}

export const Guide: Story = {
  args: { article: MOCK_ARTICLE_GUIDE },
}

export const Reference: Story = {
  args: { article: MOCK_ARTICLE_REFERENCE },
}

export const NoAuthor: Story = {
  args: {
    article: {
      ...MOCK_ARTICLE,
      author: undefined,
    },
  },
}

export const ManyTags: Story = {
  args: {
    article: {
      ...MOCK_ARTICLE,
      tags: ['nextjs', 'react', 'typescript', 'ai', 'fullstack', 'aspnet'],
    },
  },
}

export const LongTitle: Story = {
  args: {
    article: {
      ...MOCK_ARTICLE,
      title:
        'A Very Long Article Title That Should Be Clamped at Two Lines in the Card Header Component',
    },
  },
}

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      <ArticleCard article={MOCK_ARTICLE} />
      <ArticleCard article={MOCK_ARTICLE_GUIDE} />
      <ArticleCard article={MOCK_ARTICLE_REFERENCE} />
    </div>
  ),
  decorators: [],
}
