import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Github, ArrowRight } from 'lucide-react'
import type { CmsCtaButton } from '@/lib/cms/types'

type CTASectionProps = {
  heading?: string
  description?: string
  primaryCTA?: CmsCtaButton
  secondaryCTA?: CmsCtaButton
}

export function CTASection({
  heading = 'Ready to explore articles?',
  description = 'Join our community and discover proven solutions for your next project. Contribute your own articles and help others build better software.',
  primaryCTA = { label: 'Get Started', href: '/articles', variant: 'secondary' },
  secondaryCTA = {
    label: 'Star on GitHub',
    href: 'https://github.com/your-org/ai-fullstack-accelerator',
    variant: 'outline',
    icon: 'Github',
  },
}: CTASectionProps) {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{heading}</h2>
          <p className="mt-4 text-lg text-primary-foreground/90">{description}</p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href={primaryCTA.href}>
                {primaryCTA.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link
                href={secondaryCTA.href}
                target={secondaryCTA.href.startsWith('http') ? '_blank' : undefined}
                rel={secondaryCTA.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {secondaryCTA.icon === 'Github' && <Github className="mr-2 h-4 w-4" />}
                {secondaryCTA.label}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
