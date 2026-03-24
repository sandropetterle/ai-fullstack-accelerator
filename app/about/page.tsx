import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Github, Lightbulb, Users, Code2, Sparkles, Target, BookOpen, Zap } from 'lucide-react'
import { getAboutPage } from '@/lib/cms/queries'
import { DynamicZone } from '@/lib/cms/components'

const DEFAULT_METADATA: Metadata = {
  title: 'About | AI Fullstack Accelerator',
  description:
    'Learn about AI Fullstack Accelerator - a modern fullstack template for building AI-powered applications.',
  keywords: [
    'about',
    'AI',
    'fullstack',
    'accelerator',
    'Next.js',
    'ASP.NET Core',
  ],
  openGraph: {
    title: 'About | AI Fullstack Accelerator',
    description:
      'A modern fullstack template for building AI-powered applications.',
    url: 'https://your-domain.com/about',
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getAboutPage()
  if (!page.seo) return DEFAULT_METADATA
  return {
    title: page.seo.title ?? DEFAULT_METADATA.title,
    description: page.seo.description ?? (DEFAULT_METADATA.description as string),
    keywords: page.seo.keywords?.split(',').map((k) => k.trim()) ?? DEFAULT_METADATA.keywords,
    openGraph: {
      title: page.seo.ogTitle ?? page.seo.title ?? 'About | AI Fullstack Accelerator',
      description:
        page.seo.ogDescription ??
        page.seo.description ??
        (DEFAULT_METADATA.description as string),
    },
  }
}

// Revalidate every 10 minutes
export const revalidate = 600

export default async function AboutPage() {
  const page = await getAboutPage()
  const hasCmsContent = !!(page.content?.length || page.header)

  if (hasCmsContent) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {page.header && (
          <div className="max-w-3xl mx-auto text-center mb-16">
            {page.header.badge && (
              <Badge className="mb-4">{page.header.badge}</Badge>
            )}
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              {page.header.title}
            </h1>
            {page.header.subtitle && (
              <p className="text-xl text-muted-foreground leading-relaxed">
                {page.header.subtitle}
              </p>
            )}
          </div>
        )}
        {page.content?.length ? <DynamicZone content={page.content} /> : null}
      </div>
    )
  }

  // Fallback: hardcoded content when CMS has no data
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header Section */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <Badge className="mb-4">About the Platform</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
          AI Fullstack Accelerator
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          A modern fullstack template for building AI-powered applications with Next.js and ASP.NET Core.
          Curated by developers, for developers.
        </p>
      </div>

      {/* Mission Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              In the rapidly evolving landscape of AI-assisted software development, developers
              need proven patterns and strategies to effectively leverage AI tools in enterprise
              contexts. Our mission is to bridge that gap.
            </p>
            <p>
              We provide a production-ready fullstack accelerator that helps teams build and ship
              AI-powered applications faster — from architectural decisions and design patterns to
              prompt engineering and best practices.
            </p>
            <p>
              Whether you&apos;re building microservices, implementing clean architecture, or exploring
              AI-assisted code generation, you&apos;ll find practical, production-ready foundations here.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-center mb-10">What We Offer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Code2 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Modern Stack</CardTitle>
              <CardDescription>
                Next.js 16 App Router with ASP.NET Core 8 Clean Architecture backend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Next.js App Router</li>
                <li>• ASP.NET Core 8</li>
                <li>• Entity Framework Core</li>
                <li>• TypeScript throughout</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Sparkles className="h-8 w-8 text-primary mb-2" />
              <CardTitle>AI-Ready</CardTitle>
              <CardDescription>
                Built-in patterns and integrations for AI-powered features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• CMS-driven content</li>
                <li>• Article management</li>
                <li>• Search and filtering</li>
                <li>• Voting and engagement</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Best Practices</CardTitle>
              <CardDescription>
                Industry-standard practices for security, performance, and code quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Security best practices</li>
                <li>• Performance optimization</li>
                <li>• Testing strategies</li>
                <li>• CI/CD pipelines</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Lightbulb className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Real-World Examples</CardTitle>
              <CardDescription>
                Production-ready code samples and implementation examples
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Complete code samples</li>
                <li>• Step-by-step guides</li>
                <li>• Trade-off analysis</li>
                <li>• Implementation tips</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Community-Driven</CardTitle>
              <CardDescription>
                Vote on articles, share insights, and learn from the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Community voting system</li>
                <li>• Trending articles</li>
                <li>• Expert contributions</li>
                <li>• Continuous updates</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Always Up-to-Date</CardTitle>
              <CardDescription>
                Latest patterns and practices for modern development stacks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• .NET 8+ patterns</li>
                <li>• Next.js 16 best practices</li>
                <li>• Azure cloud patterns</li>
                <li>• Modern TypeScript</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="max-w-4xl mx-auto mb-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Code2 className="h-6 w-6 text-primary" />
              Built With Modern Technologies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Frontend</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Next.js 16 (App Router)</li>
                  <li>• TypeScript</li>
                  <li>• Tailwind CSS</li>
                  <li>• shadcn/ui Components</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Backend</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• ASP.NET Core 8.0</li>
                  <li>• Entity Framework Core</li>
                  <li>• Clean Architecture</li>
                  <li>• Azure SQL Database</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Info */}
      <div className="max-w-4xl mx-auto mb-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Github className="h-6 w-6 text-primary" />
              Open Source Project
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This project is open source and available on GitHub. We welcome contributions,
              suggestions, and feedback from the community.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Documentation
              </Link>
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
              >
                <Code2 className="h-4 w-4" />
                Browse Articles
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <div className="max-w-3xl mx-auto text-center">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Start Exploring Articles</CardTitle>
            <CardDescription className="text-base">
              Discover curated articles, tutorials, and guides for AI-assisted development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-lg font-medium"
            >
              Browse All Articles
              <span aria-hidden="true">→</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
