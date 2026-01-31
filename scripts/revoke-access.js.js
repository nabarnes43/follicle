// @ts-nocheck
// Usage: node scripts/revoke-access.js <userId>

require('dotenv').config({ path: '.env.local' })
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function main() {
  const userId = process.argv[2]

  if (!userId) {
    console.log('Usage: node scripts/revoke-access.js <userId>')
    process.exit(1)
  }

  const userRef = db.collection('users').doc(userId)
  const userDoc = await userRef.get()

  if (!userDoc.exists) {
    console.log('User not found')
    process.exit(1)
  }

  const accessCode = userDoc.data()?.accessCode

  if (!accessCode) {
    console.log('User has no access code')
    process.exit(1)
  }

  const batch = db.batch()

  // Remove access from user
  batch.update(userRef, {
    accessCode: FieldValue.delete(),
    accessGrantedAt: FieldValue.delete(),
  })

  // Reset the code so it can be reused
  batch.update(db.collection('access_codes').doc(accessCode), {
    used: false,
    usedBy: null,
    usedAt: null,
  })

  await batch.commit()
  console.log(
    `Revoked access from user ${userId}, code ${accessCode} is now available`
  )
}

main().catch(console.error)
