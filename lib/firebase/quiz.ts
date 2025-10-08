// lib/firebase/quiz.ts
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './client'
import { User, HairAnalysis } from '@/types/user'
import { generateFollicleId, answersToHairAnalysis } from '../quiz/follicleId'

/**
 * Save quiz results
 */
export async function saveQuizResults(
  userId: string,
  email: string | undefined,
  answers: Record<string, any>
): Promise<string> {
  const hairAnalysis = answersToHairAnalysis(answers)
  const follicleId = generateFollicleId(hairAnalysis)

  await setDoc(
    doc(db, 'users', userId),
    {
      userId,
      email: email || null,
      follicleId,
      hairAnalysis,
      quizComplete: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  )

  return follicleId
}

/**
 * Get user data
 */
export async function getUser(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', userId))
  return snap.exists() ? (snap.data() as User) : null
}

/**
 * Link anonymous quiz results to authenticated user
 * Called after sign in/signup from results page
 */
export async function linkAnonymousResults(
  newUserId: string,
  email: string,
  anonymousUserId: string
): Promise<void> {
  // Get anonymous user's data
  const anonymousData = await getUser(anonymousUserId)

  if (!anonymousData?.hairAnalysis) {
    console.log('No anonymous data to link')
    return
  }

  // Save to new authenticated user (will override if they already have data)
  await setDoc(
    doc(db, 'users', newUserId),
    {
      userId: newUserId,
      email,
      follicleId: anonymousData.follicleId,
      hairAnalysis: anonymousData.hairAnalysis,
      quizComplete: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  )

  console.log('✅ Linked anonymous results to authenticated user')
}
