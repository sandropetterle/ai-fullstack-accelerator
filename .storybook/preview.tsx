import React from 'react'
import type { Preview } from '@storybook/react'
import { withThemeByClassName } from '@storybook/addon-themes'
import { ThemeProvider } from '../components/providers/ThemeProvider'
import '../app/globals.css'

const preview: Preview = {
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
    (Story) => (
      <ThemeProvider>
        <div className="min-h-8 bg-background text-foreground">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
}

export default preview
