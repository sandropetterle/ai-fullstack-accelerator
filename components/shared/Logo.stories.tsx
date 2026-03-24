import type { Meta, StoryObj } from '@storybook/react'
import { Logo } from './Logo'

const meta: Meta<typeof Logo> = {
  title: 'Shared/Logo',
  component: Logo,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Logo>

export const Default: Story = {}

export const OnDarkBackground: Story = {
  decorators: [
    (Story) => (
      <div className="p-6 bg-primary rounded-lg">
        <Story />
      </div>
    ),
  ],
}
