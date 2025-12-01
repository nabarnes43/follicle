'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase/client'
import { signInAnonymously, onIdTokenChanged } from 'firebase/auth'
import { User as FirebaseUser } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { ProviderData } from '@/types/user'

const AuthContext = createContext<{
  user: FirebaseUser | null
  loading: boolean
}>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔵 Auth listener starting...')

    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log('👤 Auth state changed')
        console.log('   User ID:', currentUser.uid)
        console.log('   Email:', currentUser.email)
        console.log('   Is Anonymous:', currentUser.isAnonymous)
        console.log('   Provider Data:', currentUser.providerData)

        const userDocRef = doc(db, 'users', currentUser.uid)
        const userDoc = await getDoc(userDocRef)

        const providerData: ProviderData[] = currentUser.providerData.map(
          (p) => ({
            providerId: p.providerId,
            email: p.email || null,
            displayName: p.displayName || null,
            photoURL: p.photoURL || null,
            uid: p.uid,
            phoneNumber: p.phoneNumber || null,
          })
        )

        // Only update auth-related fields, don't touch analysis data
        const authData = {
          userId: currentUser.uid,
          email: currentUser.email || null,
          photoUrl: currentUser.photoURL || null,
          displayName: currentUser.displayName || null,
          isAnonymous: currentUser.isAnonymous,
          providerData: providerData,
          lastLoginAt: serverTimestamp(),
        }

        if (!userDoc.exists()) {
          console.log('📝 Creating new user document')
          await setDoc(userDocRef, {
            ...authData,
            createdAt: serverTimestamp(),
            // Don't set follicleId or analysisComplete - let analysis handle that
          })
          console.log('✅ User document created')
        } else {
          console.log('🔄 Updating existing user document')
          // Use merge: true to only update auth fields, preserve analysis data
          await setDoc(userDocRef, authData, { merge: true })
          console.log('✅ User document updated')
        }

        setUser(currentUser)
        localStorage.setItem('userId', currentUser.uid)
        // Set session cookie for server-side auth (refreshes automatically with token)
        const token = await currentUser.getIdToken()
        const secure = window.location.protocol === 'https:' ? '; Secure' : ''
        document.cookie = `session=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`
        setLoading(false)
      } else {
        console.log('🔐 No user found, signing in anonymously...')
        // Clear session cookie
        document.cookie = 'session=; path=/; max-age=0; path=/'
        signInAnonymously(auth).catch((error) => {
          console.error('❌ Anonymous sign-in error:', error)
          setLoading(false)
        })
      }
    })

    return () => {
      console.log('🧹 Auth listener cleanup')
      unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
