/**
 * Shared mock data fixtures for Storybook stories.
 * Import from this file to get consistent test data across stories.
 * Field names mirror the CMS types in lib/cms/types.ts exactly.
 */
import type { Article } from '../lib/types/article'
import type {
  CmsNavLink,
  CmsCtaButton,
  CmsStatItem,
  CmsFeatureCard,
  CmsTechGroup,
  CmsApiEndpoint,
  CmsQuickNavItem,
  CmsSupportItem,
  CmsFooterConfig,
  CmsHeroBlock,
  CmsStatsBarBlock,
  CmsFeaturedArticlesBlock,
  CmsRichTextBlock,
  CmsCtaBannerBlock,
  CmsFeatureGridBlock,
  CmsTechStackBlock,
  CmsMissionBlock,
  CmsOpenSourceInfoBlock,
  CmsPageHeaderBlock,
  CmsDocSectionBlock,
  CmsApiReferenceBlock,
  CmsQuickNavBlock,
  CmsContributingBlock,
  CmsSupportLinksBlock,
} from '../lib/cms/types'

// ---------- Article fixtures ----------

export const MOCK_ARTICLE: Article = {
  id: 'b0000000-0000-0000-0000-000000000001',
  title: 'Getting Started with AI Fullstack Development',
  slug: 'getting-started-ai-fullstack',
  shortDescription:
    'A comprehensive guide to building full-stack AI applications with Next.js, ASP.NET Core, and modern tooling.',
  fullContent: `## Overview\n\nThis guide walks you through building a modern AI-powered full-stack application.\n\n## Prerequisites\n\n- Node.js 20+\n- .NET 8 SDK\n- Docker Desktop\n\n## Getting Started\n\n\`\`\`bash\ngit clone https://github.com/your-org/ai-fullstack-accelerator\ncd ai-fullstack-accelerator\nnpm install\n\`\`\``,
  category: 'Tutorial',
  tags: ['nextjs', 'aspnet', 'ai', 'fullstack'],
  author: 'Alice Chen',
  createdDate: '2024-01-15T10:00:00Z',
  updatedDate: '2024-02-20T14:30:00Z',
  voteCount: 142,
  status: 'Published',
  isFeatured: true,
  isTrending: false,
}

export const MOCK_ARTICLE_GUIDE: Article = {
  id: 'b0000000-0000-0000-0000-000000000002',
  title: 'Deploying to Azure Container Apps',
  slug: 'deploying-azure-container-apps',
  shortDescription:
    'Step-by-step guide for deploying your Next.js and ASP.NET Core applications to Azure Container Apps.',
  category: 'Guide',
  tags: ['azure', 'docker', 'deployment', 'ci-cd'],
  author: 'Bob Smith',
  createdDate: '2024-02-01T09:00:00Z',
  updatedDate: '2024-03-10T11:00:00Z',
  voteCount: 89,
  status: 'Published',
  isFeatured: false,
  isTrending: true,
}

export const MOCK_ARTICLE_REFERENCE: Article = {
  id: 'b0000000-0000-0000-0000-000000000003',
  title: 'REST API Reference',
  slug: 'rest-api-reference',
  shortDescription:
    'Complete reference documentation for the AI Fullstack Accelerator REST API endpoints, DTOs, and authentication.',
  category: 'Reference',
  tags: ['api', 'rest', 'authentication', 'swagger'],
  author: 'Carol Davis',
  createdDate: '2024-03-05T08:00:00Z',
  updatedDate: '2024-03-15T16:00:00Z',
  voteCount: 67,
  status: 'Published',
  isFeatured: false,
  isTrending: false,
}

export const MOCK_ARTICLES: Article[] = [
  MOCK_ARTICLE,
  MOCK_ARTICLE_GUIDE,
  MOCK_ARTICLE_REFERENCE,
]

// ---------- CMS component fixtures ----------

export const MOCK_NAV_LINKS: CmsNavLink[] = [
  { label: 'Articles', href: '/articles' },
  { label: 'About', href: '/about' },
  { label: 'Docs', href: '/docs' },
]

export const MOCK_FOOTER_CONFIG: CmsFooterConfig = {
  copyrightTemplate: '© {year} AI Fullstack Accelerator. All rights reserved.',
  links: [
    { label: 'GitHub', href: 'https://github.com', isExternal: true },
    { label: 'Privacy', href: '/privacy' },
  ],
}

export const MOCK_CTA_PRIMARY: CmsCtaButton = {
  label: 'Browse Articles',
  href: '/articles',
  variant: 'primary',
}

export const MOCK_CTA_SECONDARY: CmsCtaButton = {
  label: 'View on GitHub',
  href: 'https://github.com',
  variant: 'outline',
}

export const MOCK_STAT_ITEMS: CmsStatItem[] = [
  { label: 'Articles', value: '42', icon: 'BookOpen' },
  { label: 'Categories', value: '5', icon: 'Folder' },
  { label: 'Contributors', value: '120+', icon: 'Users' },
]

export const MOCK_FEATURE_CARDS: CmsFeatureCard[] = [
  { title: 'Proven Approaches', description: 'Battle-tested solutions used by leading teams.', icon: 'Shield' },
  { title: 'AI-Powered', description: 'Optimized for AI-assisted development workflows.', icon: 'Sparkles' },
  { title: 'Open Source', description: 'Community-driven and freely available to everyone.', icon: 'Code' },
]

export const MOCK_TECH_GROUPS: CmsTechGroup[] = [
  {
    title: 'Frontend',
    items: [{ text: 'Next.js' }, { text: 'React 19' }, { text: 'TypeScript' }, { text: 'Tailwind CSS' }],
  },
  {
    title: 'Backend',
    items: [{ text: 'ASP.NET Core 8' }, { text: 'Entity Framework Core' }, { text: 'SQLite / Azure SQL' }],
  },
]

export const MOCK_API_ENDPOINTS: CmsApiEndpoint[] = [
  { method: 'GET', path: '/api/articles', description: 'List articles with filtering and pagination' },
  { method: 'GET', path: '/api/articles/{slug}', description: 'Get a single article by slug' },
  { method: 'POST', path: '/api/articles/{id}/vote', description: 'Vote on an article', rateLimit: '10/min' },
]

export const MOCK_QUICK_NAV_ITEMS: CmsQuickNavItem[] = [
  { title: 'Overview', description: 'Introduction and goals', href: '#overview' },
  { title: 'Getting Started', description: 'Quick start guide', href: '#getting-started' },
  { title: 'REST API', description: 'API reference', href: '#rest-api' },
]

export const MOCK_SUPPORT_ITEMS: CmsSupportItem[] = [
  { title: 'GitHub Issues', description: 'Report bugs or request features', href: 'https://github.com' },
  { title: 'Discussions', description: 'Ask questions and share ideas', href: 'https://github.com' },
]

// ---------- CMS Block fixtures ----------

export const MOCK_HERO_BLOCK: CmsHeroBlock = {
  __component: 'sections.hero',
  heading: 'AI Fullstack Accelerator',
  subheading: 'Curated articles, guides, and resources for full-stack AI development.',
  primaryCTA: MOCK_CTA_PRIMARY,
  secondaryCTA: MOCK_CTA_SECONDARY,
}

export const MOCK_STATS_BAR_BLOCK: CmsStatsBarBlock = {
  __component: 'sections.stats-bar',
  stats: MOCK_STAT_ITEMS,
}

export const MOCK_FEATURED_ARTICLES_BLOCK: CmsFeaturedArticlesBlock = {
  __component: 'sections.featured-articles',
  heading: 'Featured Articles',
  subheading: 'Curated articles from our community of developers.',
  viewAllLabel: 'View All Articles',
  mobileViewAllLabel: 'View All',
}

export const MOCK_RICH_TEXT_BLOCK: CmsRichTextBlock = {
  __component: 'sections.rich-text',
  body: `## What is the AI Fullstack Accelerator?\n\nA curated collection of articles and guides for building AI-powered full-stack applications.\n\n### Key benefits\n\n- **Reusable** — apply approaches across projects\n- **Documented** — clear rationale for each decision\n- **Community-driven** — contributed by practitioners`,
}

export const MOCK_CTA_BANNER_BLOCK: CmsCtaBannerBlock = {
  __component: 'sections.cta-banner',
  heading: 'Ready to build smarter?',
  description: 'Join hundreds of engineers using AI Fullstack Accelerator.',
  primaryCTA: MOCK_CTA_PRIMARY,
  secondaryCTA: MOCK_CTA_SECONDARY,
}

export const MOCK_FEATURE_GRID_BLOCK: CmsFeatureGridBlock = {
  __component: 'sections.feature-grid',
  heading: 'Why use this accelerator?',
  features: MOCK_FEATURE_CARDS,
}

export const MOCK_TECH_STACK_BLOCK: CmsTechStackBlock = {
  __component: 'sections.tech-stack',
  heading: 'Built with modern technologies',
  groups: MOCK_TECH_GROUPS,
}

export const MOCK_MISSION_BLOCK: CmsMissionBlock = {
  __component: 'sections.mission-block',
  title: 'Our Mission',
  content: 'Accelerate AI-powered application development through a shared library of proven approaches and templates.',
}

export const MOCK_OPEN_SOURCE_INFO_BLOCK: CmsOpenSourceInfoBlock = {
  __component: 'sections.open-source-info',
  title: 'Open Source & Community-Driven',
  description: 'All articles are freely available. Contribute on GitHub to help the community grow.',
  links: [{ label: 'Star on GitHub', href: 'https://github.com', variant: 'outline' }],
}

export const MOCK_PAGE_HEADER_BLOCK: CmsPageHeaderBlock = {
  __component: 'sections.page-header',
  title: 'About',
  subtitle: 'Learn more about the AI Fullstack Accelerator.',
}

export const MOCK_DOC_SECTION_BLOCK: CmsDocSectionBlock = {
  __component: 'sections.doc-section',
  anchorId: 'getting-started',
  title: 'Getting Started',
  content: 'Browse the article library and pick articles relevant to your use case. Each article includes rationale, example implementation, and trade-offs.',
}

export const MOCK_API_REFERENCE_BLOCK: CmsApiReferenceBlock = {
  __component: 'sections.api-reference',
  title: 'REST API',
  baseUrl: 'https://api.ai-fullstack-accelerator.dev',
  endpoints: MOCK_API_ENDPOINTS,
}

export const MOCK_QUICK_NAV_BLOCK: CmsQuickNavBlock = {
  __component: 'sections.quick-nav',
  heading: 'On this page',
  items: MOCK_QUICK_NAV_ITEMS,
}

export const MOCK_CONTRIBUTING_BLOCK: CmsContributingBlock = {
  __component: 'sections.contributing',
  title: 'How to Contribute',
  description: 'We welcome contributions! Open a pull request on GitHub with your new article.',
  howToTitle: 'Steps',
  steps: '1. Fork the repository\n2. Add your article\n3. Submit a pull request',
  guidelines: [
    { text: 'Follow the article template' },
    { text: 'Include a clear rationale' },
    { text: 'Add usage examples' },
  ],
  ctaButton: { label: 'Open an Issue', href: 'https://github.com', variant: 'outline' },
}

export const MOCK_SUPPORT_LINKS_BLOCK: CmsSupportLinksBlock = {
  __component: 'sections.support-links',
  title: 'Get Help',
  description: 'Several ways to get support.',
  items: MOCK_SUPPORT_ITEMS,
}
