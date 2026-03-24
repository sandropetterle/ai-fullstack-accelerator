import type { Meta, StoryObj } from '@storybook/react'
import { Checkbox } from './checkbox'
import { Label } from './label'

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    checked: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Checkbox>

export const Unchecked: Story = {
  args: { id: 'cb-unchecked' },
}

export const Checked: Story = {
  args: { id: 'cb-checked', defaultChecked: true },
}

export const Disabled: Story = {
  args: { id: 'cb-disabled', disabled: true },
}

export const DisabledChecked: Story = {
  args: { id: 'cb-disabled-checked', disabled: true, defaultChecked: true },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="featured-cb" />
      <Label htmlFor="featured-cb">Mark as Featured</Label>
    </div>
  ),
}

export const TagFilter: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {['prompting', 'reasoning', 'llm', 'architecture', 'security'].map((tag) => (
        <div key={tag} className="flex items-center gap-2">
          <Checkbox id={`tag-${tag}`} />
          <Label htmlFor={`tag-${tag}`}>{tag}</Label>
        </div>
      ))}
    </div>
  ),
}
