import type { Meta, StoryObj } from '@storybook/react'
import { ThemeToggle } from './ThemeToggle'

const meta: Meta<typeof ThemeToggle> = {
  title: 'Layout/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ThemeToggle>

export const Default: Story = {}

export const InHeader: Story = {
  render: () => (
    <div className="flex items-center gap-2 p-2 border rounded-md">
      <span className="text-sm text-muted-foreground mr-auto">Theme Toggle</span>
      <ThemeToggle />
    </div>
  ),
}
