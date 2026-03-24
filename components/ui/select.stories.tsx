import type { Meta, StoryObj } from '@storybook/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { Label } from './label'

const meta: Meta = {
  title: 'UI/Select',
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="architecture">Architecture</SelectItem>
        <SelectItem value="design-patterns">Design Patterns</SelectItem>
        <SelectItem value="ai-prompts">AI Prompts</SelectItem>
        <SelectItem value="security">Security</SelectItem>
        <SelectItem value="performance">Performance</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-64">
      <Label htmlFor="category-select">Category</Label>
      <Select>
        <SelectTrigger id="category-select">
          <SelectValue placeholder="Choose a category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="architecture">Architecture</SelectItem>
          <SelectItem value="design-patterns">Design Patterns</SelectItem>
          <SelectItem value="ai-prompts">AI Prompts</SelectItem>
          <SelectItem value="security">Security</SelectItem>
          <SelectItem value="performance">Performance</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const WithDefaultValue: Story = {
  render: () => (
    <Select defaultValue="architecture">
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="architecture">Architecture</SelectItem>
        <SelectItem value="design-patterns">Design Patterns</SelectItem>
        <SelectItem value="ai-prompts">AI Prompts</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Disabled select" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="architecture">Architecture</SelectItem>
      </SelectContent>
    </Select>
  ),
}
