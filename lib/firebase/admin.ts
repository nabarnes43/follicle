import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

// Initialize Firebase Admin (only once)
if (getApps().length === 0) {
  // Parse the service account JSON from env
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT || '{}'
  )

  initializeApp({
    credential: cert(serviceAccount),
  })
}

export const adminDb = getFirestore()
export const adminAuth = getAuth()
