import type { Meta, StoryObj } from '@storybook/react'
import { SkeletonCard } from './SkeletonCard'

const meta: Meta<typeof SkeletonCard> = {
  title: 'UI/SkeletonCard',
  component: SkeletonCard,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof SkeletonCard>

export const Default: Story = {}

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  ),
}

export const WithCustomClass: Story = {
  args: { className: 'w-64' },
}
