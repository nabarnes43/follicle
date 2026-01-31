require('dotenv').config({ path: '.env.local' })
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore, Timestamp } = require('firebase-admin/firestore')

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ'
const CODE_COUNT = 50

function generateCode() {
  let code = 'FOLLICLE-'
  for (let i = 0; i < 4; i++) {
    code += LETTERS[Math.floor(Math.random() * LETTERS.length)]
  }
  return code
}

async function main() {
  // Get existing codes
  const existing = new Set(
    (await db.collection('access_codes').listDocuments()).map((doc) => doc.id)
  )
  console.log(`Found ${existing.size} existing codes`)

  // Generate new unique codes
  const codes = new Set()
  while (codes.size < CODE_COUNT) {
    const code = generateCode()
    if (!existing.has(code)) {
      codes.add(code)
    }
  }

  const batch = db.batch()
  for (const code of codes) {
    batch.set(db.collection('access_codes').doc(code), {
      used: false,
      usedBy: null,
      usedAt: null,
      createdAt: Timestamp.now(),
    })
  }

  await batch.commit()
  console.log(
    `Added ${codes.size} new codes (${existing.size + codes.size} total)`
  )
}

main().catch(console.error)
