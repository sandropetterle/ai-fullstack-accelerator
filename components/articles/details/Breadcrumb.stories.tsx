import type { Meta, StoryObj } from '@storybook/react'
import { Breadcrumb } from './Breadcrumb'

const meta: Meta<typeof Breadcrumb> = {
  title: 'Articles/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Breadcrumb>

export const ArticleDetail: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Articles', href: '/articles' },
      { label: 'Getting Started with AI Fullstack Development', href: '/articles/getting-started-ai-fullstack' },
    ],
  },
}

export const TwoLevels: Story = {
  args: {
    items: [
      { label: 'Articles', href: '/articles' },
      { label: 'REST API Reference', href: '/articles/rest-api-reference' },
    ],
  },
}

export const LongTitle: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Articles', href: '/articles' },
      {
        label: 'A Comprehensive Guide to Deploying Full-Stack Applications on Azure Container Apps',
        href: '/articles/deploying-azure-container-apps',
      },
    ],
  },
}
