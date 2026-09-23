import { forwardRef } from 'react'
import type { LucideProps } from 'lucide-react'

/**
 * Inline replacement for the `Github` icon removed from lucide-react in v1.
 *
 * lucide-react 1.x dropped the `Github` icon (brand icons were removed from
 * the core package). This component reproduces the exact icon paths from
 * lucide-react@0.577.0 (`github.js`) so existing usages of `Github` can keep
 * working unchanged by importing this as `Github`.
 *
 * Accepts the same props as a lucide icon component (className, size,
 * strokeWidth, color, aria-*, etc.) and forwards a ref to the underlying
 * `<svg>` element, mirroring lucide's own `createLucideIcon` behavior.
 */
const GithubIcon = forwardRef<SVGSVGElement, LucideProps>(
  (
    {
      color = 'currentColor',
      size = 24,
      strokeWidth = 2,
      absoluteStrokeWidth,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const resolvedStrokeWidth = absoluteStrokeWidth
      ? (Number(strokeWidth) * 24) / Number(size)
      : strokeWidth

    const hasA11yLabel =
      'aria-label' in rest ||
      'aria-labelledby' in rest ||
      'aria-hidden' in rest ||
      'role' in rest ||
      'title' in rest

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={resolvedStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={['lucide', 'lucide-github', className].filter(Boolean).join(' ')}
        {...(!children && !hasA11yLabel ? { 'aria-hidden': 'true' } : {})}
        {...rest}
      >
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
        {children}
      </svg>
    )
  }
)

GithubIcon.displayName = 'GithubIcon'

export { GithubIcon }
export default GithubIcon
