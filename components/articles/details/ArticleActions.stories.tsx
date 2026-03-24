import type { Meta, StoryObj } from '@storybook/react'
import { ArticleActions } from './ArticleActions'
import {
  withSession,
  MOCK_ADMIN_SESSION,
  MOCK_EDITOR_SESSION,
} from '../../../.storybook/mocks/next-auth-react'

const meta: Meta<typeof ArticleActions> = {
  title: 'Articles/ArticleActions',
  component: ArticleActions,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ArticleActions>

export const EditorView: Story = {
  decorators: [withSession(MOCK_EDITOR_SESSION)],
  args: {
    slug: 'getting-started-ai-fullstack',
    articleId: 'b0000000-0000-0000-0000-000000000001',
  },
}

export const AdminView: Story = {
  decorators: [withSession(MOCK_ADMIN_SESSION)],
  args: {
    slug: 'getting-started-ai-fullstack',
    articleId: 'b0000000-0000-0000-0000-000000000001',
  },
}

export const UnauthenticatedHidden: Story = {
  args: {
    slug: 'getting-started-ai-fullstack',
    articleId: 'b0000000-0000-0000-0000-000000000001',
  },
  render: (args) => (
    <div>
      <p className="text-sm text-muted-foreground mb-2">
        No session — component renders nothing (by design).
      </p>
      <ArticleActions {...args} />
    </div>
  ),
}

export const CustomLabels: Story = {
  decorators: [withSession(MOCK_ADMIN_SESSION)],
  args: {
    slug: 'getting-started-ai-fullstack',
    articleId: 'b0000000-0000-0000-0000-000000000001',
    editLabel: 'Modify',
    deleteLabel: 'Remove',
    deleteDialogTitle: 'Permanently remove this article?',
    deleteDialogDescription: 'This cannot be undone.',
    deleteConfirmLabel: 'Yes, remove it',
  },
}
