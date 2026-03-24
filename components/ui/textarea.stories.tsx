import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from './textarea'
import { Label } from './label'

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
    rows: { control: 'number' },
  },
}

export default meta
type Story = StoryObj<typeof Textarea>

export const Default: Story = {
  args: { placeholder: 'Write your pattern description…', rows: 4, className: 'w-80' },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <Label htmlFor="description">Short Description</Label>
      <Textarea id="description" placeholder="Describe the pattern in 1–2 sentences." rows={3} />
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled',
    defaultValue: 'This field cannot be edited.',
    className: 'w-80',
  },
}

export const WithContent: Story = {
  args: {
    defaultValue:
      'Guide LLMs to reason step-by-step before producing a final answer, significantly improving accuracy on complex reasoning tasks.',
    rows: 3,
    className: 'w-80',
  },
}
