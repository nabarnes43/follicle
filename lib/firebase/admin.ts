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
    '🔍 First 1000 chars:',
    process.env.FIREBASE_SERVICE_ACCOUNT?.substring(0, 1000)
  )

  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT || '{}'
  )

  // Fix the private key formatting
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(
      /\\n/g,
      '\n'
    )
    console.log(
      '🔍 First 1000 chars replaced \n:',
      serviceAccount.private_key?.substring(0, 1000)
    )
  }

  console.log('🔍 Parsed project_id:', serviceAccount.project_id)

  initializeApp({
    credential: cert(serviceAccount),
  })
}

export const adminDb = getFirestore()
export const adminAuth = getAuth()
