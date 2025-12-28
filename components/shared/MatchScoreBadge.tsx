import { Badge } from '@/components/ui/badge'

interface MatchScoreBadgeProps {
  score: number // 0-1 decimal value
  variant?: 'default' | 'compact' // default for detail pages, compact for cards
  className?: string
}

export function MatchScoreBadge({
  score,
  variant = 'default',
  className = '',
}: MatchScoreBadgeProps) {
  const percentage = Math.round(score * 100)

  if (variant === 'compact') {
    // For cards - compact display
    return (
      <div className={`text-center ${className}`}>
        <p className="text-primary text-md leading-none font-semibold">
          {percentage}%
        </p>
        <p className="text-muted-foreground text-xs leading-tight">Match</p>
      </div>
    )
  }

  // For detail pages - badge style
  return (
    <Badge className={`px-3 py-1 text-md rounded-2xl ${className}`}>
      {percentage}% Match
    </Badge>
  )
}
