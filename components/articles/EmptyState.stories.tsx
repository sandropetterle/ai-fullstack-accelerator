import type { Meta, StoryObj } from '@storybook/react'
import { EmptyState } from './EmptyState'

const meta: Meta<typeof EmptyState> = {
  title: 'Articles/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    hasFilters: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof EmptyState>

export const Filtered: Story = {
  args: { hasFilters: true },
}

export const Unfiltered: Story = {
  args: { hasFilters: false },
}

export const CustomLabels: Story = {
  args: {
    hasFilters: true,
    filteredHeading: 'No matches found',
    filteredDescription: 'Try broadening your search or removing some filters.',
    clearFiltersLabel: 'Reset filters',
  },
}
