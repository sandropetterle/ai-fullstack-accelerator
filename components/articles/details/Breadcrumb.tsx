import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

type BreadcrumbItem = {
  label: string
  href: string
}

type BreadcrumbProps = {
  items: BreadcrumbItem[]
  ariaLabel?: string
}

export function Breadcrumb({ items, ariaLabel = 'Breadcrumb' }: BreadcrumbProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-4"
    >
      <ol className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={item.href} className="flex items-center gap-2">
              {isLast ? (
                <span className="text-foreground font-medium">{item.label}</span>
              ) : (
                <>
                  <Link
                    href={item.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
