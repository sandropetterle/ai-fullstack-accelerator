import type { Meta, StoryObj } from '@storybook/react'
import { CTASection } from './CTASection'

const meta: Meta<typeof CTASection> = {
  title: 'Home/CTASection',
  component: CTASection,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    heading: { control: 'text' },
    description: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof CTASection>

export const Default: Story = {}

export const CustomContent: Story = {
  args: {
    heading: 'Start contributing today',
    description: 'Help grow the article library. Every contribution makes a difference.',
    primaryCTA: { label: 'Browse Articles', href: '/articles', variant: 'secondary' },
    secondaryCTA: { label: 'Open an Issue', href: 'https://github.com', variant: 'outline' },
  },
}
