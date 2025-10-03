'use client'

import { Button } from '@/components/ui/button'

interface SignInButtonProps {
  onClick: () => void
  children?: React.ReactNode
}

export default function SignInButton({
  onClick,
  children = 'Sign In',
}: SignInButtonProps) {
  return (
    <Button onClick={onClick} variant="outline">
      {children}
    </Button>
  )
}
