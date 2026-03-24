import type { Meta, StoryObj } from '@storybook/react'
import { NewArticleButton } from './NewArticleButton'
import {
  withSession,
  MOCK_ADMIN_SESSION,
  MOCK_EDITOR_SESSION,
} from '../../.storybook/mocks/next-auth-react'

const meta: Meta<typeof NewArticleButton> = {
  title: 'Articles/NewArticleButton',
  component: NewArticleButton,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof NewArticleButton>

export const Unauthenticated: Story = {}

export const AuthenticatedEditor: Story = {
  decorators: [withSession(MOCK_EDITOR_SESSION)],
}

export const AuthenticatedAdmin: Story = {
  decorators: [withSession(MOCK_ADMIN_SESSION)],
}
