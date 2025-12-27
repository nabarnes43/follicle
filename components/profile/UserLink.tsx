'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface UserLinkProps {
  userId: string
  displayName: string
  className?: string
  onClick?: () => void
}

export function UserLink({
  userId,
  displayName,
  className,
  onClick,
}: UserLinkProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent parent click handlers (like card clicks)
    if (onClick) onClick()
    router.push(`/profile/${userId}`)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'hover:underline focus:underline focus:outline-none',
        className
      )}
    >
      {displayName}
    </button>
  )
}
