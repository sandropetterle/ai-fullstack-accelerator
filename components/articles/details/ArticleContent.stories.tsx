import type { Meta, StoryObj } from '@storybook/react'
import { ArticleContent } from './ArticleContent'

const SAMPLE_MARKDOWN = `## Overview

This guide walks you through building a modern AI-powered full-stack application using Next.js and ASP.NET Core.

## Prerequisites

Use this guide when:

- You need a **production-ready** starting point
- You want to integrate AI capabilities
- You need full-stack TypeScript + .NET

## Example

\`\`\`bash
git clone https://github.com/your-org/ai-fullstack-accelerator
cd ai-fullstack-accelerator
npm install
\`\`\`

## Variants

### Minimal Setup

Clone the repo and run docker compose to start all services.

> "Start with the accelerator, not from scratch" — focus on your domain, not boilerplate.

### Full Production Setup

Deploy to Azure Container Apps using the provided Bicep IaC.

## Trade-offs

| Benefit | Cost |
|---------|------|
| Fast start | Learning curve |
| Production-ready | Opinionated stack |
| AI-integrated | Requires Azure |

## Further Reading

- [Next.js Documentation](https://nextjs.org/docs)
- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core)
`

const meta: Meta<typeof ArticleContent> = {
  title: 'Articles/ArticleContent',
  component: ArticleContent,
  tags: ['autodocs'],
  argTypes: {
    content: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof ArticleContent>

export const FullArticle: Story = {
  args: { content: SAMPLE_MARKDOWN },
}

export const Simple: Story = {
  args: {
    content: `## Overview\n\nA simple article with minimal content.\n\n- Point one\n- Point two\n- Point three`,
  },
}

export const WithCodeBlock: Story = {
  args: {
    content: `## Implementation\n\n\`\`\`typescript\nasync function fetchArticles(): Promise<Article[]> {\n  const response = await fetch('/api/articles')\n  return response.json()\n}\n\`\`\`\n\nInline code: use \`const\` not \`let\` for immutable values.`,
  },
}

export const WithTable: Story = {
  args: {
    content: `## Comparison\n\n| Approach | Speed | Complexity |\n|----------|-------|------------|\n| Direct | Fast | Low |\n| Cached | Faster | Medium |\n| CDN | Fastest | High |`,
  },
}
