// @ts-nocheck
// Usage: node scripts/list-access-users.js

require('dotenv').config({ path: '.env.local' })
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function main() {
  const snapshot = await db
    .collection('users')
    .where('accessCode', '!=', null)
    .get()

  if (snapshot.empty) {
    console.log('No users with access codes')
    return
  }

  console.log(`Found ${snapshot.size} users with access:\n`)

  snapshot.forEach((doc) => {
    const data = doc.data()
    console.log(`- ${doc.id}`)
    console.log(`  Email: ${data.email || 'anonymous'}`)
    console.log(`  Code: ${data.accessCode}`)
    console.log(`  Granted: ${data.accessGrantedAt?.toDate?.() || 'unknown'}`)
    console.log('')
  })
}

main().catch(console.error)
