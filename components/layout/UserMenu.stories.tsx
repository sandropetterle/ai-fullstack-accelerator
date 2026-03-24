import type { Meta, StoryObj } from '@storybook/react'
import { UserMenu } from './UserMenu'
import {
  withSession,
  withLoadingSession,
  MOCK_ADMIN_SESSION,
  MOCK_EDITOR_SESSION,
  MOCK_VIEWER_SESSION,
} from '../../.storybook/mocks/next-auth-react'

const meta: Meta<typeof UserMenu> = {
  title: 'Layout/UserMenu',
  component: UserMenu,
  tags: ['autodocs'],
  argTypes: {
    signInLabel: { control: 'text' },
    signOutLabel: { control: 'text' },
    userMenuLabel: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof UserMenu>

export const SignedOut: Story = {
  args: {},
}

export const Loading: Story = {
  decorators: [withLoadingSession],
  args: {},
}

export const SignedInAdmin: Story = {
  decorators: [withSession(MOCK_ADMIN_SESSION)],
  args: {},
}

export const SignedInEditor: Story = {
  decorators: [withSession(MOCK_EDITOR_SESSION)],
  args: {},
}

export const SignedInViewer: Story = {
  decorators: [withSession(MOCK_VIEWER_SESSION)],
  args: {},
}

export const CustomLabels: Story = {
  decorators: [withSession(MOCK_ADMIN_SESSION)],
  args: {
    signInLabel: 'Login',
    signOutLabel: 'Logout',
    userMenuLabel: 'Account',
  },
}
