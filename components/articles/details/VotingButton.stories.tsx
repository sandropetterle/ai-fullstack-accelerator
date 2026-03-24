import type { Meta, StoryObj } from '@storybook/react'
import { VotingButton } from './VotingButton'

const meta: Meta<typeof VotingButton> = {
  title: 'Articles/VotingButton',
  component: VotingButton,
  tags: ['autodocs'],
  argTypes: {
    initialVoteCount: { control: 'number' },
  },
}

export default meta
type Story = StoryObj<typeof VotingButton>

export const Default: Story = {
  args: {
    initialVoteCount: 142,
    articleId: 'b0000000-0000-0000-0000-000000000001',
  },
}

export const LowVotes: Story = {
  args: {
    initialVoteCount: 3,
    articleId: 'b0000000-0000-0000-0000-000000000002',
  },
}

export const ZeroVotes: Story = {
  args: {
    initialVoteCount: 0,
    articleId: 'b0000000-0000-0000-0000-000000000003',
  },
}
