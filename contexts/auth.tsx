'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase/client'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { User as FirebaseUser } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { User, ProviderData } from '@/types/user'

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

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
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

        const userData: Partial<User> = {
          userId: currentUser.uid,
          email: currentUser.email || null,
          photoUrl: currentUser.photoURL || null,
          follicleId: '',
          quizComplete: null,
          isAnonymous: currentUser.isAnonymous,
          providerData: providerData,
          lastLoginAt: serverTimestamp(),
        }

        if (!userDoc.exists()) {
          console.log('📝 Creating new user document')
          await setDoc(userDocRef, {
            ...userData,
            createdAt: serverTimestamp(),
          })
          console.log('✅ User document created')
        } else {
          console.log('🔄 Updating existing user document')
          await setDoc(userDocRef, userData, { merge: true })
          console.log('✅ User document updated')
        }

        setUser(currentUser)
        localStorage.setItem('userId', currentUser.uid)
        setLoading(false)
      } else {
        console.log('🔐 No user found, signing in anonymously...')
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
