'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

type DateRangeFilterProps = {
  dateFrom?: string
  dateTo?: string
  dateRangeHeader?: string
  clearDatesLabel?: string
  fromLabel?: string
  toLabel?: string
}

export function DateRangeFilter({
  dateFrom,
  dateTo,
  dateRangeHeader = 'Date Range',
  clearDatesLabel = 'Clear dates',
  fromLabel = 'From',
  toLabel = 'To',
}: DateRangeFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const hasActiveDates = !!(dateFrom || dateTo)

  const updateDates = useCallback(
    (key: 'dateFrom' | 'dateTo', value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`/articles?${params.toString()}`)
    },
    [searchParams, router]
  )

  const handleClearDates = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('dateFrom')
    params.delete('dateTo')
    params.delete('page')
    router.push(`/articles?${params.toString()}`)
  }, [searchParams, router])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{dateRangeHeader}</Label>
        {hasActiveDates && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearDates}
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            {clearDatesLabel}
          </Button>
        )}
      </div>
      <div className="space-y-2">
        <div>
          <Label htmlFor="date-from" className="text-xs text-muted-foreground">
            {fromLabel}
          </Label>
          <input
            id="date-from"
            type="date"
            value={dateFrom || ''}
            onChange={(e) => updateDates('dateFrom', e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <div>
          <Label htmlFor="date-to" className="text-xs text-muted-foreground">
            {toLabel}
          </Label>
          <input
            id="date-to"
            type="date"
            value={dateTo || ''}
            min={dateFrom || undefined}
            onChange={(e) => updateDates('dateTo', e.target.value)}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>
    </div>
  )
}
