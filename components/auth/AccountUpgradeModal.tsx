'use client'

import { useState } from 'react'
import { auth, db } from '@/lib/firebase/client'
import {
  GoogleAuthProvider,
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Get profile data from linked providers
// Google has displayName/photoURL, Email/Password doesn't
function getProfileData(providers: any[]) {
  // Check if Google is linked (has profile data)
  const googleProvider = providers.find((p) => p.providerId === 'google.com')
  if (googleProvider) {
    return {
      displayName: googleProvider.displayName,
      photoURL: googleProvider.photoURL,
      email: googleProvider.email,
    }
  }

  // Fallback to email provider (no profile data)
  return {
    displayName: null,
    photoURL: null,
    email: providers[0]?.email || null,
  }
}

// Update Firestore after linking
async function updateUserProfile(user: any) {
  const profile = getProfileData(user.providerData)

  await setDoc(
    doc(db, 'users', user.uid),
    {
      uid: user.uid,
      isAnonymous: user.isAnonymous,
      email: profile.email,
      displayName: profile.displayName,
      photoURL: profile.photoURL,
      providerData: user.providerData.map((p: any) => ({
        providerId: p.providerId,
        email: p.email,
        displayName: p.displayName,
        photoURL: p.photoURL,
      })),
      lastLoginAt: serverTimestamp(),
    },
    { merge: true }
  )

  console.log('✅ User profile updated in Firestore')
}

export default function AccountUpgradeModal({
  onClose,
}: {
  onClose: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleSignIn = async () => {
    if (!auth.currentUser) {
      setError('No user logged in')
      return
    }

    console.log('🔗 Linking anonymous user to Google...')

    try {
      setLoading(true)
      setError('')

      const provider = new GoogleAuthProvider()
      const result = await linkWithPopup(auth.currentUser, provider)

      console.log('✅ Google linked successfully')
      console.log('User:', result.user.email)

      await updateUserProfile(result.user)
      onClose()
    } catch (err: any) {
      console.error('❌ Google link failed:', err.code)

      if (err.code === 'auth/credential-already-in-use') {
        setError('This Google account is already linked to another account.')
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!auth.currentUser) {
      setError('No user logged in')
      return
    }

    console.log('🔗 Linking anonymous user to email/password...')

    try {
      setLoading(true)
      setError('')

      const credential = EmailAuthProvider.credential(email, password)
      const result = await linkWithCredential(auth.currentUser, credential)

      console.log('✅ Email/password linked successfully')
      console.log('User:', result.user.email)

      await updateUserProfile(result.user)
      onClose()
    } catch (err: any) {
      console.error('❌ Email link failed:', err.code)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-8">
        <h2 className="mb-4 text-2xl font-bold">Save Your Progress</h2>
        <p className="mb-6 text-gray-600">
          Create an account to access your hair profile across all devices
        </p>

        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mb-4 w-full"
          variant="outline"
        >
          {loading ? 'Linking...' : 'Continue with Google'}
        </Button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or</span>
          </div>
        </div>

        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
        </form>

        <button
          onClick={onClose}
          className="mt-4 w-full text-gray-500 hover:text-gray-700"
        >
          Maybe Later
        </button>
      </div>
    </div>
  )
}
