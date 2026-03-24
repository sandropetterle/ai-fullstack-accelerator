import type { Meta, StoryObj } from '@storybook/react'
import { Hero } from './Hero'
import { MOCK_CTA_PRIMARY, MOCK_CTA_SECONDARY } from '../../.storybook/fixtures'

const meta: Meta<typeof Hero> = {
  title: 'Home/Hero',
  component: Hero,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    heading: { control: 'text' },
    subheading: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof Hero>

export const Default: Story = {}

export const WithCmsContent: Story = {
  args: {
    heading: 'AI Fullstack Accelerator',
    subheading:
      'Curated articles, guides, and resources for full-stack AI development. Discover proven approaches and best practices.',
    primaryCTA: MOCK_CTA_PRIMARY,
    secondaryCTA: MOCK_CTA_SECONDARY,
  },
}

export const CustomHeading: Story = {
  args: {
    heading: 'Build Smarter AI Applications',
    subheading:
      'A curated collection of articles, guides, and best practices for modern AI-powered application development.',
  },
}
