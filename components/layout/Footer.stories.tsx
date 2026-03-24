import type { Meta, StoryObj } from '@storybook/react'
import { Footer } from './Footer'
import { MOCK_FOOTER_CONFIG } from '../../.storybook/fixtures'

const meta: Meta<typeof Footer> = {
  title: 'Layout/Footer',
  component: Footer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof Footer>

export const Default: Story = {}

export const WithCmsConfig: Story = {
  args: { footerConfig: MOCK_FOOTER_CONFIG },
}

export const MinimalConfig: Story = {
  args: {
    footerConfig: {
      copyrightTemplate: '© {year} My Company.',
    },
  },
}
