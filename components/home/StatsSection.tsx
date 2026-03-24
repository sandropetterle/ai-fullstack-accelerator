import { BookOpen, Folder, Users } from 'lucide-react'
import type { CmsStatItem } from '@/lib/cms/types'

type StatsSectionProps = {
  totalArticles: number
  totalCategories: number
  totalContributors: string
  statLabels?: CmsStatItem[]
}

const DEFAULT_STATS = [
  { icon: 'BookOpen', label: 'Articles Available' },
  { icon: 'Folder', label: 'Categories' },
  { icon: 'Users', label: 'Contributors' },
]

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Folder,
  Users,
}

export function StatsSection({ totalArticles, totalCategories, totalContributors, statLabels }: StatsSectionProps) {
  const statsData = [
    {
      value: totalArticles,
      label: statLabels?.[0]?.label ?? DEFAULT_STATS[0].label,
      icon: statLabels?.[0]?.icon ?? DEFAULT_STATS[0].icon,
    },
    {
      value: totalCategories,
      label: statLabels?.[1]?.label ?? DEFAULT_STATS[1].label,
      icon: statLabels?.[1]?.icon ?? DEFAULT_STATS[1].icon,
    },
    {
      value: totalContributors,
      label: statLabels?.[2]?.label ?? DEFAULT_STATS[2].label,
      icon: statLabels?.[2]?.icon ?? DEFAULT_STATS[2].icon,
    },
  ]

  return (
    <section className="py-16 sm:py-20 lg:py-24 animate-fade-in">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {statsData.map((stat, i) => {
            const Icon = ICON_MAP[stat.icon] ?? BookOpen
            return (
              <div key={i} className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
                <div className="mb-4 p-3 rounded-full bg-primary/10">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
