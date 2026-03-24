import type { Meta, StoryObj } from '@storybook/react'
import { RelatedArticlesSection } from './RelatedArticlesSection'
import { MOCK_ARTICLES } from '../../../.storybook/fixtures'

const meta: Meta<typeof RelatedArticlesSection> = {
  title: 'Articles/RelatedArticlesSection',
  component: RelatedArticlesSection,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof RelatedArticlesSection>

export const WithRelated: Story = {
  args: { articles: MOCK_ARTICLES },
}

export const Empty: Story = {
  args: { articles: [] },
}

export const Single: Story = {
  args: { articles: [MOCK_ARTICLES[0]] },
}
