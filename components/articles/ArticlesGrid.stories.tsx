import type { Meta, StoryObj } from '@storybook/react'
import { ArticlesGrid } from './ArticlesGrid'
import { MOCK_ARTICLES } from '../../.storybook/fixtures'

const meta: Meta<typeof ArticlesGrid> = {
  title: 'Articles/ArticlesGrid',
  component: ArticlesGrid,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof ArticlesGrid>

export const Default: Story = {
  args: { articles: MOCK_ARTICLES },
}

export const SingleArticle: Story = {
  args: { articles: [MOCK_ARTICLES[0]] },
}

export const Empty: Story = {
  args: { articles: [] },
}
