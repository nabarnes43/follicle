import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

if (getApps().length === 0) {
  try {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT || '{}'
    )

    console.log('🔍 Initializing Firebase Admin...')

    initializeApp({
      credential: cert(serviceAccount),
    })

    console.log('✅ Firebase Admin initialized')
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error)
    throw error
  }
}

export const adminDb = getFirestore()
export const adminAuth = getAuth()
