import Link from 'next/link'
import { Sparkles } from 'lucide-react'

type LogoProps = {
  siteName?: string
}

export function Logo({ siteName = 'AI Fullstack Accelerator' }: LogoProps) {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
      <Sparkles className="h-6 w-6 text-primary" />
      <span>{siteName}</span>
    </Link>
  )
}
