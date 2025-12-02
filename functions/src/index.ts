// functions/src/index.ts
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { onRequest } from 'firebase-functions/v2/https'

import { Product } from './types/product'
import { HairAnalysis } from './types/user'
import { ProductMatchScore } from './types/productMatching'
import { matchProductsForUser } from './scoring/productMatcher'

// Initialize Firebase Admin (auto-credentials when deployed)
initializeApp()

const db = getFirestore()

// ============================================================================
// HEALTHCHECK
// ============================================================================

export const healthcheck = onRequest((req, res) => {
  res.send('Functions operational')
})

// ============================================================================
// SCORE PRODUCTS ON HAIR ANALYSIS CHANGE
// ============================================================================

export const onUserWrite = onDocumentWritten(
  {
    document: 'users/{userId}',
    memory: '1GiB', // Scoring 8K products needs more memory
    timeoutSeconds: 540, // 9 minutes max
  },
  async (event) => {
    const userId = event.params.userId
    const beforeData = event.data?.before.data()
    const afterData = event.data?.after.data()

    // Skip if document was deleted
    if (!afterData) {
      console.log(`User ${userId} deleted, skipping scoring`)
      return
    }

    const beforeAnalysis = beforeData?.hairAnalysis as HairAnalysis | undefined
    const afterAnalysis = afterData?.hairAnalysis as HairAnalysis | undefined

    console.log('Before hairAnalysis:', JSON.stringify(beforeAnalysis))
    console.log('After hairAnalysis:', JSON.stringify(afterAnalysis))

    // Skip if no hair analysis yet
    if (!afterAnalysis) {
      console.log(`User ${userId} has no hairAnalysis, skipping`)
      return
    }

    // Skip if hairAnalysis hasn't changed (avoid unnecessary rescoring)
    if (beforeAnalysis && !hasAnalysisChanged(beforeAnalysis, afterAnalysis)) {
      console.log(`User ${userId} hairAnalysis unchanged, skipping`)
      return
    }

    console.log(`🚀 Scoring products for user ${userId}...`)

    try {
      // 1. Fetch all products
      const productsSnapshot = await db.collection('products').get()
      const products: Product[] = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[]

      console.log(`📦 Fetched ${products.length} products`)

      // 2. Get follicleId
      const follicleId = afterData.follicleId as string
      if (!follicleId) {
        console.error(`User ${userId} has no follicleId`)
        return
      }

      // 3. Score all products
      const scored = await matchProductsForUser(
        { hairAnalysis: afterAnalysis },
        products,
        follicleId
      )

      console.log(`✅ Scored ${scored.length} products`)

      // 4. Write scores to subcollection
      await writeScoresToFirestore(userId, scored)

      console.log(`💾 Saved scores for user ${userId}`)
    } catch (error) {
      console.error(`❌ Error scoring for user ${userId}:`, error)
      throw error // Rethrow to mark function as failed (enables retry)
    }
  }
)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if hair analysis has changed (compare core 5 fields)
 */
function hasAnalysisChanged(
  before: HairAnalysis,
  after: HairAnalysis
): boolean {
  return (
    before.hairType !== after.hairType ||
    before.porosity !== after.porosity ||
    before.density !== after.density ||
    before.thickness !== after.thickness ||
    before.damage !== after.damage
  )
}

/**
 * Write scored products to user's subcollection
 * Uses batched writes (Firestore limit: 500 per batch)
 */
async function writeScoresToFirestore(
  userId: string,
  scored: ProductMatchScore[]
): Promise<void> {
  const scoresRef = db
    .collection('users')
    .doc(userId)
    .collection('product_scores')

  // Delete existing scores first
  const existingScores = await scoresRef.get()
  if (!existingScores.empty) {
    const deleteBatches: FirebaseFirestore.WriteBatch[] = []
    let deleteBatch = db.batch()
    let deleteCount = 0

    existingScores.docs.forEach((doc) => {
      deleteBatch.delete(doc.ref)
      deleteCount++

      if (deleteCount === 500) {
        deleteBatches.push(deleteBatch)
        deleteBatch = db.batch()
        deleteCount = 0
      }
    })

    if (deleteCount > 0) {
      deleteBatches.push(deleteBatch)
    }

    await Promise.all(deleteBatches.map((b) => b.commit()))
    console.log(`🗑️ Deleted ${existingScores.size} existing scores`)
  }

  // Write new scores in batches
  const writeBatches: FirebaseFirestore.WriteBatch[] = []
  let writeBatch = db.batch()
  let writeCount = 0

  scored.forEach((item, index) => {
    const docRef = scoresRef.doc(item.product.id)

    writeBatch.set(docRef, {
      score: item.totalScore,
      rank: index + 1, // Pre-calculated rank (1 = best)
      category: item.product.category,
      breakdown: item.breakdown,
      matchReasons: item.matchReasons.slice(0, 5), // Limit stored reasons
      interactionsByTier: item.interactionsByTier || null,
      scoredAt: new Date(),
    })

    writeCount++

    if (writeCount === 500) {
      writeBatches.push(writeBatch)
      writeBatch = db.batch()
      writeCount = 0
    }
  })

  if (writeCount > 0) {
    writeBatches.push(writeBatch)
  }

  await Promise.all(writeBatches.map((b) => b.commit()))
  console.log(
    `✅ Wrote ${scored.length} scores in ${writeBatches.length} batches`
  )
}
