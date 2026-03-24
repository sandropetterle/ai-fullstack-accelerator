import type { Meta, StoryObj } from '@storybook/react'
import { Navigation } from './Navigation'
import { MOCK_NAV_LINKS } from '../../.storybook/fixtures'

const meta: Meta<typeof Navigation> = {
  title: 'Layout/Navigation',
  component: Navigation,
  tags: ['autodocs'],
  argTypes: {
    mobileMenuTitle: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof Navigation>

export const Default: Story = {
  args: { navLinks: MOCK_NAV_LINKS },
}

export const CustomTitle: Story = {
  args: {
    navLinks: MOCK_NAV_LINKS,
    mobileMenuTitle: 'Navigation',
  },
}

export const WithExternalLink: Story = {
  args: {
    navLinks: [
      ...MOCK_NAV_LINKS,
      { label: 'GitHub', href: 'https://github.com', isExternal: true },
    ],
  },
}
