// Audit price data across all products
// Usage: node scripts/audit-product-prices.js

require('dotenv').config({ path: '.env.local' })
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function main() {
  const snapshot = await db.collection('products').get()
  console.log(`Found ${snapshot.size} products\n`)

  let missing = 0
  let validNumber = 0
  let needsNormalization = []

  for (const doc of snapshot.docs) {
    const { price, name } = doc.data()

    if (price === undefined || price === null) {
      missing++
    } else if (typeof price === 'number') {
      validNumber++
    } else {
      // String, object, or anything unexpected
      needsNormalization.push({ id: doc.id, name, price, type: typeof price })
    }
  }

  console.log(`Valid number:       ${validNumber}`)
  console.log(`Missing/null:       ${missing}`)
  console.log(`Needs normalization: ${needsNormalization.length}\n`)

  if (needsNormalization.length > 0) {
    console.log('Sample of products needing normalization:')
    needsNormalization.slice(0, 10).forEach(({ id, name, price, type }) => {
      console.log(`  [${type}] ${name} (${id}): ${JSON.stringify(price)}`)
    })
  }
}

main().catch(console.error)
