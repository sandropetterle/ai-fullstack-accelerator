/**
 * Storybook stories for lib/cms/components.tsx CMS dynamic zone renderers.
 *
 * Each story renders one or more blocks through the DynamicZone component,
 * using mock Strapi data from .storybook/fixtures.ts.
 *
 * These stories bridge Pillar 2 (CMS Component Reference) and Pillar 3 (Storybook).
 * See documentation/cms-components/ for field documentation.
 */
import type { Meta, StoryObj } from '@storybook/react'
import { DynamicZone } from './components'
import {
  MOCK_HERO_BLOCK,
  MOCK_CTA_BANNER_BLOCK,
  MOCK_STATS_BAR_BLOCK,
  MOCK_RICH_TEXT_BLOCK,
  MOCK_FEATURE_GRID_BLOCK,
  MOCK_TECH_STACK_BLOCK,
  MOCK_MISSION_BLOCK,
  MOCK_OPEN_SOURCE_INFO_BLOCK,
  MOCK_PAGE_HEADER_BLOCK,
  MOCK_DOC_SECTION_BLOCK,
  MOCK_API_REFERENCE_BLOCK,
  MOCK_QUICK_NAV_BLOCK,
  MOCK_CONTRIBUTING_BLOCK,
  MOCK_SUPPORT_LINKS_BLOCK,
} from '../../.storybook/fixtures'

const meta: Meta<typeof DynamicZone> = {
  title: 'CMS/DynamicZone',
  component: DynamicZone,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof DynamicZone>

// ── Individual block stories ────────────────────────────────────────────

export const Hero: Story = {
  args: { content: [MOCK_HERO_BLOCK] },
}

export const CtaBanner: Story = {
  args: { content: [MOCK_CTA_BANNER_BLOCK] },
}

export const CtaBannerHighlighted: Story = {
  args: {
    content: [{ ...MOCK_CTA_BANNER_BLOCK, variant: 'highlighted' }],
  },
}

export const StatsBar: Story = {
  args: { content: [MOCK_STATS_BAR_BLOCK] },
}

export const RichText: Story = {
  args: { content: [MOCK_RICH_TEXT_BLOCK] },
}

export const FeatureGrid: Story = {
  args: { content: [MOCK_FEATURE_GRID_BLOCK] },
}

export const FeatureGridFourColumns: Story = {
  args: {
    content: [{ ...MOCK_FEATURE_GRID_BLOCK, columns: '4' as const }],
  },
}

export const TechStack: Story = {
  args: { content: [MOCK_TECH_STACK_BLOCK] },
}

export const MissionBlock: Story = {
  args: { content: [MOCK_MISSION_BLOCK] },
}

export const OpenSourceInfo: Story = {
  args: { content: [MOCK_OPEN_SOURCE_INFO_BLOCK] },
}

export const PageHeader: Story = {
  args: { content: [MOCK_PAGE_HEADER_BLOCK] },
}

export const PageHeaderWithBadge: Story = {
  args: {
    content: [{ ...MOCK_PAGE_HEADER_BLOCK, badge: 'Documentation' }],
  },
}

export const DocSection: Story = {
  args: { content: [MOCK_DOC_SECTION_BLOCK] },
}

export const ApiReference: Story = {
  args: { content: [MOCK_API_REFERENCE_BLOCK] },
}

export const QuickNav: Story = {
  args: { content: [MOCK_QUICK_NAV_BLOCK] },
}

export const Contributing: Story = {
  args: { content: [MOCK_CONTRIBUTING_BLOCK] },
}

export const SupportLinks: Story = {
  args: { content: [MOCK_SUPPORT_LINKS_BLOCK] },
}

// ── Composite page layouts ──────────────────────────────────────────────

export const HomepageLayout: Story = {
  name: 'Composite: Homepage Layout',
  args: {
    content: [
      MOCK_HERO_BLOCK,
      MOCK_STATS_BAR_BLOCK,
      MOCK_FEATURE_GRID_BLOCK,
      MOCK_CTA_BANNER_BLOCK,
    ],
  },
}

export const AboutPageLayout: Story = {
  name: 'Composite: About Page Layout',
  args: {
    content: [
      MOCK_PAGE_HEADER_BLOCK,
      MOCK_MISSION_BLOCK,
      MOCK_TECH_STACK_BLOCK,
      MOCK_OPEN_SOURCE_INFO_BLOCK,
    ],
  },
}

export const DocsPageLayout: Story = {
  name: 'Composite: Docs Page Layout',
  args: {
    content: [
      { ...MOCK_PAGE_HEADER_BLOCK, title: 'Documentation', badge: 'v1.0' },
      MOCK_QUICK_NAV_BLOCK,
      MOCK_DOC_SECTION_BLOCK,
      MOCK_API_REFERENCE_BLOCK,
      MOCK_CONTRIBUTING_BLOCK,
      MOCK_SUPPORT_LINKS_BLOCK,
    ],
  },
}
