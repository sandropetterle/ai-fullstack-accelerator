import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import type { CmsCtaButton } from '@/lib/cms/types'

type HeroProps = {
  heading?: string
  subheading?: string
  primaryCTA?: CmsCtaButton
  secondaryCTA?: CmsCtaButton
}

export function Hero({
  heading = 'AI Fullstack Accelerator',
  subheading = 'Curated articles, guides, and resources for full-stack AI development. Discover proven approaches, best practices, and innovative solutions to accelerate your development.',
  primaryCTA = { label: 'Browse Articles', href: '/articles', variant: 'primary' },
  secondaryCTA = { label: 'Learn More', href: '#featured', variant: 'outline' },
}: HeroProps) {
  return (
    <section className="relative py-20 sm:py-24 lg:py-32">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center animate-slide-up">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {heading}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed">
            {subheading}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href={primaryCTA.href}>
                {primaryCTA.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={secondaryCTA.href}>{secondaryCTA.label}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
