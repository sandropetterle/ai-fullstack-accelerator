import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './badge'

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {
  args: { children: 'AI Prompts' },
}

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'prompting' },
}

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Deleted' },
}

export const Outline: Story = {
  args: { variant: 'outline', children: 'Draft' },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
}

export const CategoryBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Architecture</Badge>
      <Badge>Design Patterns</Badge>
      <Badge>AI Prompts</Badge>
      <Badge>Security</Badge>
      <Badge>Performance</Badge>
    </div>
  ),
}
