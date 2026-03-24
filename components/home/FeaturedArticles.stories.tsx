import type { Meta, StoryObj } from '@storybook/react'
import { FeaturedArticles } from './FeaturedArticles'
import { MOCK_ARTICLES } from '../../.storybook/fixtures'

const meta: Meta<typeof FeaturedArticles> = {
  title: 'Home/FeaturedArticles',
  component: FeaturedArticles,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof FeaturedArticles>

export const Default: Story = {
  args: { articles: MOCK_ARTICLES },
}

export const WithCmsLabels: Story = {
  args: {
    articles: MOCK_ARTICLES,
    heading: 'Featured Articles',
    subheading: 'Curated articles from our community of developers.',
    viewAllLabel: 'View All Articles',
    mobileViewAllLabel: 'View All',
  },
}

export const Empty: Story = {
  args: { articles: [] },
}
