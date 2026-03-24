import Link from 'next/link'
import { Github } from 'lucide-react'
import type { CmsFooterConfig } from '@/lib/cms/types'

const DEFAULT_FOOTER: CmsFooterConfig = {
  copyrightTemplate: '© {year} AI Fullstack Accelerator. All rights reserved.',
  links: [
    { label: 'GitHub', href: 'https://github.com/your-org/ai-fullstack-accelerator', isExternal: true },
    { label: 'Documentation', href: '/docs', isExternal: false },
  ],
}

type FooterProps = {
  footerConfig?: CmsFooterConfig
}

export function Footer({ footerConfig = DEFAULT_FOOTER }: FooterProps) {
  const copyright = (footerConfig.copyrightTemplate ?? DEFAULT_FOOTER.copyrightTemplate).replace(
    '{year}',
    String(new Date().getFullYear())
  )
  const links = footerConfig.links ?? DEFAULT_FOOTER.links ?? []

  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">{copyright}</div>
          <div className="flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                target={link.isExternal ? '_blank' : undefined}
                rel={link.isExternal ? 'noopener noreferrer' : undefined}
              >
                {link.isExternal && link.href.includes('github') && <Github className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
