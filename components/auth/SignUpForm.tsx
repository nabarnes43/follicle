'use client'

import { useState } from 'react'
import { auth, db } from '@/lib/firebase/client'
import {
  GoogleAuthProvider,
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, ProviderData } from '@/types/user'

// Helper typed function
function getProfileData(providers: ProviderData[]) {
  const googleProvider = providers.find((p) => p.providerId === 'google.com')
  if (googleProvider?.displayName) {
    return {
      email: googleProvider.email || null,
      photoUrl: googleProvider.photoURL || null,
      displayName: googleProvider.displayName || null, // Add this
    }
  }

  // Email provider has no displayName/photoURL
  const providerWithEmail = providers.find((p) => p.email)
  return {
    email: providerWithEmail?.email || null,
    photoUrl: null,
    displayName: null, // Add this
  }
}

// Update Firestore with user profile
async function updateUserProfile(firebaseUser: any) {
  const providerData: ProviderData[] = firebaseUser.providerData.map(
    (p: any) => ({
      providerId: p.providerId,
      email: p.email || null,
      displayName: p.displayName || null,
      photoURL: p.photoURL || null,
      uid: p.uid,
      phoneNumber: p.phoneNumber || null,
    })
  )

  const profile = getProfileData(providerData)

  const userData: Partial<User> = {
    userId: firebaseUser.uid,
    email: profile.email,
    photoUrl: profile.photoUrl,
    displayName: profile.displayName, // Add this
    follicleId: '',
    quizComplete: null,
    isAnonymous: firebaseUser.isAnonymous,
    providerData: providerData,
    lastLoginAt: serverTimestamp(),
  }

  await setDoc(doc(db, 'users', firebaseUser.uid), userData, { merge: true })
  console.log('✅ User profile updated')
}
interface SignUpFormProps {
  onSuccess: () => void
}

export default function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleSignUp = async () => {
    const currentUser = auth.currentUser

    try {
      setLoading(true)
      setError('')
      const provider = new GoogleAuthProvider()

      // If anonymous user, link the account
      if (currentUser?.isAnonymous) {
        console.log('🔗 Linking anonymous account to Google')
        const result = await linkWithPopup(currentUser, provider)
        console.log('✅ Google linked:', result.user.email)
        await updateUserProfile(result.user)
      } else {
        // Otherwise, sign in/create new account
        console.log('🔐 Signing up with Google')
        const result = await signInWithPopup(auth, provider)
        console.log('✅ Google sign-up successful:', result.user.email)
        await updateUserProfile(result.user)
      }

      onSuccess()
    } catch (err: any) {
      console.error('❌ Google sign-up failed:', err.code)

      if (err.code === 'auth/credential-already-in-use') {
        setError('This Google account already exists. Try signing in instead.')
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-up cancelled.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const currentUser = auth.currentUser

    try {
      setLoading(true)
      setError('')

      // If anonymous user, link the account
      if (currentUser?.isAnonymous) {
        console.log('🔗 Linking anonymous account to email')
        const credential = EmailAuthProvider.credential(email, password)
        const result = await linkWithCredential(currentUser, credential)
        console.log('✅ Email linked:', result.user.email)
        await updateUserProfile(result.user)
      } else {
        // Otherwise, create new account
        console.log('🔐 Creating account with email')
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        )
        console.log('✅ Account created:', result.user.email)
        await updateUserProfile(result.user)
      }

      onSuccess()
    } catch (err: any) {
      console.error('❌ Email sign-up failed:', err.code)

      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use. Try signing in instead.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.')
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
        className="w-full rounded-2xl bg-[#DB4437] text-white hover:bg-[#DB4437]/50 hover:text-white"
        onClick={handleGoogleSignUp}
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

      <form onSubmit={handleEmailSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            type="password"
            placeholder="Min 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
    </div>
  )
}
