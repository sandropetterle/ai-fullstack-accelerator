'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTransition, useState, useCallback, useRef, useId } from 'react'
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions'
import type { ArticleListItem } from '@/lib/types/article'

type SearchBarProps = {
  allArticles?: ArticleListItem[]
  allTags?: string[]
  searchPlaceholder?: string
}

export function SearchBar({ allArticles = [], allTags = [], searchPlaceholder = 'Search articles...' }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const listboxId = useId()

  const initialValue = searchParams.get('q') || ''
  const [searchValue, setSearchValue] = useState(initialValue)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const { suggestions } = useSearchSuggestions(searchValue, allArticles, allTags)

  const inputRef = useRef<HTMLInputElement>(null)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value.trim()) {
        params.set('q', value.trim())
      } else {
        params.delete('q')
      }

      params.delete('page')

      startTransition(() => {
        router.push(`/articles?${params.toString()}`)
      })
    },
    [searchParams, router]
  )

  const handleClear = () => {
    setSearchValue('')
    setShowSuggestions(false)
    setActiveIndex(-1)
    handleSearch('')
  }

  const selectSuggestion = useCallback(
    (suggestion: string) => {
      setSearchValue(suggestion)
      setShowSuggestions(false)
      setActiveIndex(-1)
      handleSearch(suggestion)
    },
    [handleSearch]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        selectSuggestion(suggestions[activeIndex])
      } else {
        handleSearch(searchValue)
        setShowSuggestions(false)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setActiveIndex(-1)
    }
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) setShowSuggestions(true)
  }

  const handleInputBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false)
      setActiveIndex(-1)
    }, 150)
  }

  const handleSuggestionMouseDown = (suggestion: string) => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
    selectSuggestion(suggestion)
  }

  const hasSuggestions = showSuggestions && suggestions.length > 0
  const activeOptionId =
    activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={hasSuggestions}
        aria-controls={hasSuggestions ? listboxId : undefined}
        aria-activedescendant={activeOptionId}
        aria-autocomplete="list"
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(e) => {
          setSearchValue(e.target.value)
          setShowSuggestions(true)
          setActiveIndex(-1)
        }}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        className="pl-9 pr-9"
        disabled={isPending}
        maxLength={200}
      />
      {searchValue && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={handleClear}
          tabIndex={-1}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}

      {/* Suggestions Dropdown */}
      {hasSuggestions && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={() => handleSuggestionMouseDown(suggestion)}
              className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                index === activeIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
