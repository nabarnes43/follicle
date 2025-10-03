'use client'

import { auth } from '@/lib/firebase/client'
import { signOut } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function SignOutButton() {
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    console.log('👋 Signing out...')

    try {
      setLoading(true)
      await signOut(auth)
      console.log('✅ Signed out successfully')
    } catch (err) {
      console.error('❌ Sign out failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleSignOut} disabled={loading} variant="outline">
      {loading ? 'Signing Out...' : 'Sign Out'}
    </Button>
  )
}
