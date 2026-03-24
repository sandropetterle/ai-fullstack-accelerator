import type { Meta, StoryObj } from '@storybook/react'
import { ArticleForm } from './ArticleForm'
import { MOCK_ARTICLE } from '../../.storybook/fixtures'
import {
  withSession,
  MOCK_ADMIN_SESSION,
  MOCK_EDITOR_SESSION,
} from '../../.storybook/mocks/next-auth-react'

const meta: Meta<typeof ArticleForm> = {
  title: 'Articles/ArticleForm',
  component: ArticleForm,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ArticleForm>

export const CreateAsEditor: Story = {
  decorators: [withSession(MOCK_EDITOR_SESSION)],
  args: { mode: 'create' },
}

export const CreateAsAdmin: Story = {
  decorators: [withSession(MOCK_ADMIN_SESSION)],
  args: { mode: 'create' },
}

export const EditExisting: Story = {
  decorators: [withSession(MOCK_ADMIN_SESSION)],
  args: {
    mode: 'edit',
    initialData: MOCK_ARTICLE,
  },
}

export const WithCmsLabels: Story = {
  decorators: [withSession(MOCK_EDITOR_SESSION)],
  args: {
    mode: 'create',
    labels: {
      createTitle: 'New Article',
      titleLabel: 'Title',
      titlePlaceholder: 'Article name',
      shortDescLabel: 'Short Description',
      categoryLabel: 'Category',
      tagsLabel: 'Tags',
      contentLabel: 'Full Content (Markdown)',
      authorLabel: 'Author',
      createLabel: 'Create Article',
      cancelLabel: 'Cancel',
    },
  },
}
