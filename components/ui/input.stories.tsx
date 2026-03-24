import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './input'
import { Label } from './label'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'date'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: { placeholder: 'Search patterns…' },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-72">
      <Label htmlFor="title">Pattern Title</Label>
      <Input id="title" placeholder="Enter pattern title" />
    </div>
  ),
}

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Disabled input', value: 'Read-only value' },
}

export const Password: Story = {
  args: { type: 'password', placeholder: 'Enter password' },
}

export const WithError: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-72">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        aria-invalid="true"
        aria-describedby="email-error"
        defaultValue="not-an-email"
        className="border-destructive focus-visible:ring-destructive"
      />
      <p id="email-error" className="text-sm text-destructive">
        Please enter a valid email address.
      </p>
    </div>
  ),
}

export const SearchInput: Story = {
  args: { type: 'search', placeholder: 'Search patterns…', className: 'w-72' },
}
