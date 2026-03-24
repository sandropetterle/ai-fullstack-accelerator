import type { Meta, StoryObj } from '@storybook/react'
import { Header } from './Header'
import { MOCK_NAV_LINKS } from '../../.storybook/fixtures'
import {
  withSession,
  MOCK_ADMIN_SESSION,
} from '../../.storybook/mocks/next-auth-react'

const meta: Meta<typeof Header> = {
  title: 'Layout/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof Header>

export const SignedOut: Story = {
  args: { navLinks: MOCK_NAV_LINKS },
}

export const SignedIn: Story = {
  decorators: [withSession(MOCK_ADMIN_SESSION)],
  args: { navLinks: MOCK_NAV_LINKS },
}

export const CustomLabels: Story = {
  args: {
    navLinks: MOCK_NAV_LINKS,
    signInLabel: 'Login',
    signOutLabel: 'Logout',
    mobileMenuTitle: 'Site Navigation',
  },
}
