import type { Meta, StoryObj } from '@storybook/react'
import { Label } from './label'
import { Input } from './input'
import { Checkbox } from './checkbox'

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Label>

export const Default: Story = {
  args: { children: 'Pattern Title', htmlFor: 'title' },
}

export const WithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="pattern-title">Pattern Title</Label>
      <Input id="pattern-title" placeholder="Enter title" />
    </div>
  ),
}

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="featured" />
      <Label htmlFor="featured">Mark as Featured</Label>
    </div>
  ),
}

export const Required: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="req-title">
        Pattern Title <span className="text-destructive">*</span>
      </Label>
      <Input id="req-title" placeholder="Required field" aria-required="true" />
    </div>
  ),
}
