import type { Meta, StoryObj } from '@storybook/react'
import { StatsSection } from './StatsSection'
import { MOCK_STAT_ITEMS } from '../../.storybook/fixtures'

const meta: Meta<typeof StatsSection> = {
  title: 'Home/StatsSection',
  component: StatsSection,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    totalArticles: { control: 'number' },
    totalCategories: { control: 'number' },
    totalContributors: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof StatsSection>

export const Default: Story = {
  args: {
    totalArticles: 42,
    totalCategories: 5,
    totalContributors: '120+',
  },
}

export const WithCmsLabels: Story = {
  args: {
    totalArticles: 42,
    totalCategories: 5,
    totalContributors: '120+',
    statLabels: MOCK_STAT_ITEMS,
  },
}

export const LargeNumbers: Story = {
  args: {
    totalArticles: 1200,
    totalCategories: 24,
    totalContributors: '5,000+',
  },
}
