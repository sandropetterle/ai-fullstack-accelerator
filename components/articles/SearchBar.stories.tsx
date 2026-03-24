import type { Meta, StoryObj } from '@storybook/react'
import { SearchBar } from './SearchBar'
import { MOCK_ARTICLES } from '../../.storybook/fixtures'

const ALL_TAGS = ['nextjs', 'react', 'typescript', 'azure', 'docker', 'deployment', 'api', 'authentication']

const meta: Meta<typeof SearchBar> = {
  title: 'Articles/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  parameters: {
    nextjs: { appDirectory: true },
  },
}

export default meta
type Story = StoryObj<typeof SearchBar>

export const Empty: Story = {
  args: { allArticles: [], allTags: [] },
}

export const WithSuggestions: Story = {
  args: {
    allArticles: MOCK_ARTICLES,
    allTags: ALL_TAGS,
  },
}
