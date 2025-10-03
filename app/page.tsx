'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth'
import AuthDialog from '@/components/auth/AuthDialog'
import SignUpButton from '@/components/auth/SignUpButton'
import SignInButton from '@/components/auth/SignInButton'
import SignOutButton from '@/components/auth/SignOutButton'

export default function Home() {
  const { user, loading } = useAuth()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authTab, setAuthTab] = useState<'signup' | 'signin'>('signup')

  if (loading) return <div>Loading...</div>

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-5xl font-bold">Follicle v0.0</h1>

      {user?.isAnonymous ? (
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">You're browsing anonymously</p>
          <SignUpButton
            onClick={() => {
              setAuthTab('signup')
              setShowAuthDialog(true)
            }}
          >
            Create Account
          </SignUpButton>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <p className="font-medium">
            Welcome, {user?.email || user?.displayName}
          </p>
          <SignOutButton />
        </div>
      )}

      <div className="space-x-2">
        <SignUpButton
          onClick={() => {
            setAuthTab('signup')
            setShowAuthDialog(true)
          }}
        />
        <SignInButton
          onClick={() => {
            setAuthTab('signin')
            setShowAuthDialog(true)
          }}
        />
      </div>

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        defaultTab={authTab}
      />
    </div>
  )
}
