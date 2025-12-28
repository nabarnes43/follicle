'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  /** Custom text instead of "Back" */
  label?: string
  /** Custom onClick handler (defaults to router.back()) */
  onClick?: () => void
  /** Additional CSS classes */
  className?: string
  /** Button variant */
  variant?: 'ghost' | 'outline' | 'default'
  /** Button size */
  size?: 'sm' | 'default' | 'lg'
}

/**
 * BackButton - Reusable back navigation button
 *
 * Used in detail pages, saved pages, and anywhere users need to go back.
 * Defaults to browser back navigation via router.back()
 */
export function BackButton({
  label = 'Back',
  onClick,
  variant = 'ghost',
  size = 'sm',
  className = '',
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.back()
    }
  }

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={className}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}
