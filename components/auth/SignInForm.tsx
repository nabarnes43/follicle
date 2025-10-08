'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase/client'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SignInFormProps {
  onSuccess: () => void
}

export default function SignInForm({ onSuccess }: SignInFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sign in with Google
  const handleGoogleSignIn = async () => {
    console.log('🔐 Signing in with Google...')

    try {
      setLoading(true)
      setError('')

      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)

      console.log('✅ Google sign-in successful:', result.user.email)
      onSuccess()
    } catch (err: any) {
      console.error('❌ Google sign-in failed:', err.code)

      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Sign in with email/password
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('🔐 Signing in with email/password...')

    try {
      setLoading(true)
      setError('')

      const result = await signInWithEmailAndPassword(auth, email, password)

      console.log('✅ Email sign-in successful:', result.user.email)
      onSuccess()
    } catch (err: any) {
      console.error('❌ Email sign-in failed:', err.code)

      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.')
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.')
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 py-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="button"
        variant="outline"
        className=" rounded-2xl w-full bg-[#DB4437] text-white hover:bg-[#DB4437]/50 hover:text-white"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">Or</span>
        </div>
      </div>

      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signin-email">Email</Label>
          <Input
            id="signin-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signin-password">Password</Label>
          <Input
            id="signin-password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>
    </div>
  )
}
