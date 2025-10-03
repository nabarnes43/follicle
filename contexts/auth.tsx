'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase/client'
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'

const AuthContext = createContext<{ user: User | null; loading: boolean }>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        console.log('📋 Current user data:', {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          isAnonymous: currentUser.isAnonymous,
          providerData: currentUser.providerData, // Shows which providers are linked
        })

        const userDocRef = doc(db, 'users', currentUser.uid)
        const userDoc = await getDoc(userDocRef)

        const userData = {
          uid: currentUser.uid,
          isAnonymous: currentUser.isAnonymous,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          providerData: currentUser.providerData.map((p) => ({
            providerId: p.providerId,
            uid: p.uid,
            displayName: p.displayName,
            email: p.email,
            photoURL: p.photoURL,
          })),
          lastLoginAt: serverTimestamp(),
        }

        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            ...userData,
            createdAt: serverTimestamp(),
          })
          console.log('✅ Created user document')
        } else {
          await setDoc(userDocRef, userData, { merge: true })
          console.log('✅ Updated user document')
        }

        setUser(currentUser)
        localStorage.setItem('userId', currentUser.uid)
        setLoading(false)
      } else {
        console.log('🔐 No user, signing in anonymously...')
        signInAnonymously(auth).catch((error) => {
          console.error('❌ Sign-in error:', error)
          setLoading(false)
        })
      }
    })

    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
