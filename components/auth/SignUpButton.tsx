'use client'

import { Button } from '@/components/ui/button'

interface SignUpButtonProps {
  onClick: () => void
  children?: React.ReactNode
}

export default function SignUpButton({
  onClick,
  children = 'Sign Up',
}: SignUpButtonProps) {
  return <Button onClick={onClick}>{children}</Button>
}
