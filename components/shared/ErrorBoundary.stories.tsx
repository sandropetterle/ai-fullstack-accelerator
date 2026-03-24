import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { ErrorBoundary } from './ErrorBoundary'

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Shared/ErrorBoundary',
  component: ErrorBoundary,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ErrorBoundary>

function ThrowingComponent(): never {
  throw new Error('Simulated render error for Storybook')
}

export const NoError: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="p-4 rounded-md border bg-card text-card-foreground text-sm">
        Content rendered normally without errors.
      </div>
    </ErrorBoundary>
  ),
}

export const WithError: Story = {
  render: () => (
    <ErrorBoundary>
      <ThrowingComponent />
    </ErrorBoundary>
  ),
}

export const WithCustomFallback: Story = {
  render: () => (
    <ErrorBoundary
      fallback={
        <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
          Custom fallback: failed to load content.
        </div>
      }
    >
      <ThrowingComponent />
    </ErrorBoundary>
  ),
}
