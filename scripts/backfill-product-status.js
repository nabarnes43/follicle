// One-time backfill: sets status, addedByUserId, addedByUserName on all existing products
// Usage: node scripts/backfill-product-status.js

require('dotenv').config({ path: '.env.local' })
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function main() {
  const snapshot = await db.collection('products').get()
  console.log(`Found ${snapshot.size} products to backfill...`)

  let batch = db.batch()
  let batchCount = 0
  let skipped = 0
  let updated = 0

  for (const doc of snapshot.docs) {
    // Skip if already backfilled
    if (doc.data().status !== undefined) {
      skipped++
      continue
    }

    batch.update(doc.ref, {
      status: 'approved',
      addedByUserId: 'follicle_system',
      addedByUserName: 'Follicle',
    })

    batchCount++
    updated++

    // Firestore batch limit is 500
    if (batchCount === 500) {
      await batch.commit()
      console.log(`Committed batch. Updated so far: ${updated}`)
      batch = db.batch()
      batchCount = 0
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    await batch.commit()
  }

  console.log(`Done. Updated: ${updated}, Skipped (already set): ${skipped}`)
}

main().catch(console.error)
