import type { Meta, StoryObj } from '@storybook/react'
import { LoadingAnnouncer } from './LoadingAnnouncer'

const meta: Meta<typeof LoadingAnnouncer> = {
  title: 'UI/LoadingAnnouncer',
  component: LoadingAnnouncer,
  tags: ['autodocs'],
  argTypes: {
    isPending: { control: 'boolean' },
    message: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof LoadingAnnouncer>

export const Idle: Story = {
  args: { isPending: false },
}

export const Loading: Story = {
  args: { isPending: true, message: 'Loading results…' },
  render: (args) => (
    <div>
      <p className="text-sm text-muted-foreground mb-2">
        The component below is visually hidden (screen-reader only). Inspect the DOM to see the live region.
      </p>
      <LoadingAnnouncer {...args} />
    </div>
  ),
}

export const CustomMessage: Story = {
  args: { isPending: true, message: 'Filtering patterns…' },
}
