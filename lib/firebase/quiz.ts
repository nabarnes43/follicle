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
  email: string | undefined, // Can be undefined
  answers: Record<string, any>
): Promise<string> {
  const hairAnalysis = answersToHairAnalysis(answers)
  const follicleId = generateFollicleId(hairAnalysis)

  await setDoc(
    doc(db, 'users', userId),
    {
      userId,
      email: email || null, // Save as null if no email
      follicleId,
      hairAnalysis,
      quizComplete: serverTimestamp(), // Add timestamp here
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
