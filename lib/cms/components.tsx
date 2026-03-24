/**
 * Dynamic Zone renderer.
 * Maps Strapi `__component` discriminants to React components.
 * Used by page Server Components that receive a `content` dynamic zone array.
 *
 * Components in this file are intentionally thin wrappers that forward CMS
 * data to the real UI components. The real components keep their own props
 * and are not coupled to the CMS schema.
 */

import React from 'react';
import { sanitizeCmsHtml } from './sanitize';
import type {
  CmsApiReferenceBlock,
  CmsContributingBlock,
  CmsCtaBannerBlock,
  CmsDocSectionBlock,
  CmsDynamicZoneBlock,
  CmsFeaturedArticlesBlock,
  CmsFeatureGridBlock,
  CmsHeroBlock,
  CmsMissionBlock,
  CmsOpenSourceInfoBlock,
  CmsPageHeaderBlock,
  CmsQuickNavBlock,
  CmsRichTextBlock,
  CmsStatsBarBlock,
  CmsSupportLinksBlock,
  CmsTechStackBlock,
} from './types';

// ── Renderers ─────────────────────────────────────────────────────────────
// These are thin server-renderable wrappers. The real UI components are
// imported only where they are actually needed (page files).
// This keeps this file importable without pulling in all component code.

function HeroRenderer({ block }: { block: CmsHeroBlock }) {
  return (
    <section className="relative py-20 sm:py-24 lg:py-32">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {block.heading}
          </h1>
          {block.subheading && (
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed">
              {block.subheading}
            </p>
          )}
          {(block.primaryCTA || block.secondaryCTA) && (
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {block.primaryCTA && (
                <a
                  href={block.primaryCTA.href}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                >
                  {block.primaryCTA.label}
                </a>
              )}
              {block.secondaryCTA && (
                <a
                  href={block.secondaryCTA.href}
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium shadow-sm hover:bg-accent transition-colors"
                >
                  {block.secondaryCTA.label}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CtaBannerRenderer({ block }: { block: CmsCtaBannerBlock }) {
  const isHighlighted = block.variant === 'highlighted';
  return (
    <section className={`py-16 sm:py-20 lg:py-24 ${isHighlighted ? 'bg-primary text-primary-foreground' : ''}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{block.heading}</h2>
          {block.description && (
            <p className={`mt-4 text-lg ${isHighlighted ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
              {block.description}
            </p>
          )}
          {(block.primaryCTA || block.secondaryCTA) && (
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {block.primaryCTA && (
                <a
                  href={block.primaryCTA.href}
                  className="inline-flex items-center justify-center rounded-md bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground shadow hover:bg-secondary/90 transition-colors"
                  target={block.primaryCTA.href.startsWith('http') ? '_blank' : undefined}
                  rel={block.primaryCTA.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {block.primaryCTA.label}
                </a>
              )}
              {block.secondaryCTA && (
                <a
                  href={block.secondaryCTA.href}
                  className={`inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium transition-colors ${
                    isHighlighted
                      ? 'bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10'
                      : 'border-input bg-background hover:bg-accent'
                  }`}
                  target={block.secondaryCTA.href.startsWith('http') ? '_blank' : undefined}
                  rel={block.secondaryCTA.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {block.secondaryCTA.label}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatsBarRenderer({ block }: { block: CmsStatsBarBlock }) {
  if (!block.stats?.length) return null;
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {block.stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
              <div className="text-4xl font-bold mb-2">{stat.value}</div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedArticlesRenderer({ block }: { block: CmsFeaturedArticlesBlock }) {
  // Note: actual article data is NOT from CMS — it comes from the API.
  // This renderer only provides the heading/labels. Pages pass article data separately.
  return (
    <div data-cms-featured-articles data-heading={block.heading} data-subheading={block.subheading ?? ''} />
  );
}

function RichTextRenderer({ block }: { block: CmsRichTextBlock }) {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl prose prose-neutral dark:prose-invert">
        <div dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(block.body) }} />
      </div>
    </section>
  );
}

function FeatureGridRenderer({ block }: { block: CmsFeatureGridBlock }) {
  const colClass = { '2': 'md:grid-cols-2', '3': 'md:grid-cols-2 lg:grid-cols-3', '4': 'md:grid-cols-2 lg:grid-cols-4' }[block.columns ?? '3'];
  return (
    <section className="py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-10">{block.heading}</h2>
        <div className={`grid grid-cols-1 ${colClass} gap-6`}>
          {block.features?.map((feature, i) => (
            <div key={i} className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
              {feature.items?.length ? (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {feature.items.map((item, j) => (
                    <li key={j}>• {item.text}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TechStackRenderer({ block }: { block: CmsTechStackBlock }) {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h2 className="text-2xl font-bold mb-6">{block.heading}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {block.groups?.map((group, i) => (
            <div key={i} className="rounded-lg border bg-card p-5">
              <h3 className="font-semibold mb-3">{group.title}</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {group.items?.map((item, j) => (
                  <li key={j}>• {item.text}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MissionBlockRenderer({ block }: { block: CmsMissionBlock }) {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="rounded-lg border bg-card p-8">
          <h2 className="text-2xl font-bold mb-4">{block.title}</h2>
          <div className="prose prose-neutral dark:prose-invert text-muted-foreground">
            {block.content.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function OpenSourceInfoRenderer({ block }: { block: CmsOpenSourceInfoBlock }) {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="rounded-lg border bg-card p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">{block.title}</h2>
          {block.description && (
            <p className="text-muted-foreground mb-6">{block.description}</p>
          )}
          <div className="flex flex-wrap gap-3 justify-center">
            {block.links?.map((link, i) => (
              <a
                key={i}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PageHeaderRenderer({ block }: { block: CmsPageHeaderBlock }) {
  return (
    <div className="max-w-3xl mx-auto text-center mb-16">
      {block.badge && (
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4">
          {block.badge}
        </span>
      )}
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">{block.title}</h1>
      {block.subtitle && (
        <p className="text-xl text-muted-foreground leading-relaxed">{block.subtitle}</p>
      )}
    </div>
  );
}

function DocSectionRenderer({ block }: { block: CmsDocSectionBlock }) {
  return (
    <section id={block.anchorId} className="py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">{block.title}</h2>
        <div className="prose prose-neutral dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(block.content) }} />
        </div>
      </div>
    </section>
  );
}

function ApiReferenceRenderer({ block }: { block: CmsApiReferenceBlock }) {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <h2 className="text-2xl font-bold mb-2">{block.title}</h2>
        {block.description && <p className="text-muted-foreground mb-4">{block.description}</p>}
        {block.baseUrl && <p className="text-sm font-mono mb-6 text-muted-foreground">Base URL: {block.baseUrl}</p>}
        {block.endpoints?.length ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Method</th>
                  <th className="text-left px-4 py-3 font-medium">Endpoint</th>
                  <th className="text-left px-4 py-3 font-medium">Description</th>
                  <th className="text-left px-4 py-3 font-medium">Auth</th>
                  <th className="text-left px-4 py-3 font-medium">Rate Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {block.endpoints.map((ep, i) => (
                  <tr key={i} className="hover:bg-muted/25">
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded px-2 py-0.5 text-xs font-mono font-bold bg-primary/10 text-primary">
                        {ep.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{ep.path}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ep.description}</td>
                    <td className="px-4 py-3">{ep.authRequired ? 'Required' : 'None'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ep.rateLimit ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function QuickNavRenderer({ block }: { block: CmsQuickNavBlock }) {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h2 className="text-2xl font-bold mb-6">{block.heading}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {block.items?.map((item, i) => (
            <a
              key={i}
              href={item.href}
              className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContributingRenderer({ block }: { block: CmsContributingBlock }) {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">{block.title}</h2>
        {block.description && <p className="text-muted-foreground mb-6">{block.description}</p>}
        {block.howToTitle && (
          <>
            <h3 className="text-xl font-semibold mb-3">{block.howToTitle}</h3>
            {block.steps && (
              <div className="prose prose-neutral dark:prose-invert mb-6">
                <div dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(block.steps) }} />
              </div>
            )}
          </>
        )}
        {block.guidelinesTitle && block.guidelines?.length ? (
          <>
            <h3 className="text-xl font-semibold mb-3">{block.guidelinesTitle}</h3>
            <ul className="space-y-2 mb-6">
              {block.guidelines.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  {g.text}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {block.ctaButton && (
          <a
            href={block.ctaButton.href}
            target={block.ctaButton.href.startsWith('http') ? '_blank' : undefined}
            rel={block.ctaButton.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {block.ctaButton.label}
          </a>
        )}
      </div>
    </section>
  );
}

function SupportLinksRenderer({ block }: { block: CmsSupportLinksBlock }) {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h2 className="text-2xl font-bold mb-2">{block.title}</h2>
        {block.description && <p className="text-muted-foreground mb-6">{block.description}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {block.items?.map((item, i) => (
            <a
              key={i}
              href={item.href}
              target={item.href.startsWith('http') ? '_blank' : undefined}
              rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="rounded-lg border bg-card p-5 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Component registry ────────────────────────────────────────────────────

const RENDERERS: Record<string, React.ComponentType<{ block: CmsDynamicZoneBlock }>> = {
  'sections.hero': ({ block }) => <HeroRenderer block={block as CmsHeroBlock} />,
  'sections.cta-banner': ({ block }) => <CtaBannerRenderer block={block as CmsCtaBannerBlock} />,
  'sections.stats-bar': ({ block }) => <StatsBarRenderer block={block as CmsStatsBarBlock} />,
  'sections.featured-articles': ({ block }) => <FeaturedArticlesRenderer block={block as CmsFeaturedArticlesBlock} />,
  'sections.rich-text': ({ block }) => <RichTextRenderer block={block as CmsRichTextBlock} />,
  'sections.feature-grid': ({ block }) => <FeatureGridRenderer block={block as CmsFeatureGridBlock} />,
  'sections.tech-stack': ({ block }) => <TechStackRenderer block={block as CmsTechStackBlock} />,
  'sections.mission-block': ({ block }) => <MissionBlockRenderer block={block as CmsMissionBlock} />,
  'sections.open-source-info': ({ block }) => <OpenSourceInfoRenderer block={block as CmsOpenSourceInfoBlock} />,
  'sections.page-header': ({ block }) => <PageHeaderRenderer block={block as CmsPageHeaderBlock} />,
  'sections.doc-section': ({ block }) => <DocSectionRenderer block={block as CmsDocSectionBlock} />,
  'sections.api-reference': ({ block }) => <ApiReferenceRenderer block={block as CmsApiReferenceBlock} />,
  'sections.quick-nav': ({ block }) => <QuickNavRenderer block={block as CmsQuickNavBlock} />,
  'sections.contributing': ({ block }) => <ContributingRenderer block={block as CmsContributingBlock} />,
  'sections.support-links': ({ block }) => <SupportLinksRenderer block={block as CmsSupportLinksBlock} />,
};

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Renders a Strapi Dynamic Zone array.
 * Unknown component types are silently skipped.
 */
export function DynamicZone({ content }: { content: CmsDynamicZoneBlock[] }) {
  return (
    <>
      {content.map((block, i) => {
        const Renderer = RENDERERS[block.__component];
        if (!Renderer) return null;
        return <Renderer key={`${block.__component}-${i}`} block={block} />;
      })}
    </>
  );
}
