import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

// Initialize Firebase Admin (only once)
if (getApps().length === 0) {
  console.log(
    '🔍 FIREBASE_SERVICE_ACCOUNT exists:',
    !!process.env.FIREBASE_SERVICE_ACCOUNT
  )
  console.log(
    '🔍 First 100 chars:',
    process.env.FIREBASE_SERVICE_ACCOUNT?.substring(0, 100)
  )

  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT || '{}'
  )

  console.log('🔍 Parsed project_id:', serviceAccount.project_id)

  initializeApp({
    credential: cert(serviceAccount),
  })
}

export const adminDb = getFirestore()
export const adminAuth = getAuth()
