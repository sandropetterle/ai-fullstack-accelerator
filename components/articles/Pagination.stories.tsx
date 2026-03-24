import type { Meta, StoryObj } from '@storybook/react'
import { Pagination } from './Pagination'

const meta: Meta<typeof Pagination> = {
  title: 'Articles/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  argTypes: {
    currentPage: { control: { type: 'number', min: 1 } },
    totalPages: { control: { type: 'number', min: 1 } },
    hasNextPage: { control: 'boolean' },
    hasPreviousPage: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Pagination>

export const FirstPage: Story = {
  args: { currentPage: 1, totalPages: 10, hasNextPage: true, hasPreviousPage: false },
}

export const MiddlePage: Story = {
  args: { currentPage: 5, totalPages: 10, hasNextPage: true, hasPreviousPage: true },
}

export const LastPage: Story = {
  args: { currentPage: 10, totalPages: 10, hasNextPage: false, hasPreviousPage: true },
}

export const FewPages: Story = {
  args: { currentPage: 2, totalPages: 4, hasNextPage: true, hasPreviousPage: true },
}

export const SinglePage: Story = {
  args: { currentPage: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  render: (args) => (
    <div>
      <p className="text-sm text-muted-foreground mb-2">
        Single page — renders nothing (returns null).
      </p>
      <Pagination {...args} />
    </div>
  ),
}
