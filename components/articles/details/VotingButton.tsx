'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { voteForArticle } from '@/lib/api/articles'
import { toast } from 'sonner'

type VotingButtonProps = {
  initialVoteCount: number
  articleId: string
  votesLabel?: string
  voteAriaTemplate?: string
  voteAnnouncementTemplate?: string
}

export function VotingButton({
  initialVoteCount,
  articleId,
  votesLabel = 'votes',
  voteAriaTemplate = 'Vote for this article. {count} votes',
  voteAnnouncementTemplate = 'Voted! {count} total votes',
}: VotingButtonProps) {
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  const [hasVoted, setHasVoted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [justVoted, setJustVoted] = useState(false)

  const handleVote = async () => {
    if (isLoading || hasVoted) return

    // Optimistic update
    setVoteCount((prev) => prev + 1)
    setHasVoted(true)
    setIsLoading(true)

    try {
      const response = await voteForArticle(articleId)
      setVoteCount(response.voteCount) // Use actual count from backend
      setJustVoted(true)
      // Clear announcement after a short delay
      setTimeout(() => setJustVoted(false), 3000)
    } catch (error) {
      // Revert on error
      setVoteCount((prev) => prev - 1)
      setHasVoted(false)
      toast.error('Failed to record your vote. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={handleVote}
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={isLoading || hasVoted}
        aria-pressed={hasVoted}
        aria-label={voteAriaTemplate.replace('{count}', String(voteCount))}
        aria-busy={isLoading}
      >
        <Heart
          className={`h-4 w-4 transition-all ${
            hasVoted ? 'fill-red-500 text-red-500 scale-125' : ''
          }`}
          aria-hidden="true"
        />
        <span className="font-medium">{voteCount}</span>
        <span className="text-muted-foreground">{votesLabel}</span>
      </Button>
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {justVoted ? voteAnnouncementTemplate.replace('{count}', String(voteCount)) : ''}
      </span>
    </>
  )
}
