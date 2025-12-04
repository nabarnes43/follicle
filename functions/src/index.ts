// functions/src/index.ts
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { onRequest } from 'firebase-functions/v2/https'

import { Product } from './types/product'
import { ProductMatchScore } from './types/productMatching'
import { Routine } from './types/routine'
import { RoutineMatchScore } from './types/routineMatching'
import { matchProductsForUser } from './products/scoring/productMatcher'
import { matchRoutinesForUser } from './routines/scoring/routineMatcher'
import { decodeFollicleIdToAnalysis } from './shared/follicleId'
import { MATCH_REASONS_CONFIG } from './shared/constants'

// Initialize Firebase Admin
initializeApp()

const db = getFirestore()

// ============================================================================
// HEALTHCHECK
// ============================================================================

export const healthcheck = onRequest((req, res) => {
  res.send('Functions operational')
})

// ============================================================================
// SCORE PRODUCTS AND ROUTINES ON FOLLICLE ID CHANGE
// ============================================================================

export const onUserWrite = onDocumentWritten(
  {
    document: 'users/{userId}',
    memory: '1GiB',
    timeoutSeconds: 540,
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

    const beforeFollicleId = beforeData?.follicleId as string | undefined
    const afterFollicleId = afterData.follicleId as string | undefined

    // Skip if no follicleId yet
    if (!afterFollicleId) {
      console.log(`User ${userId} has no follicleId, skipping`)
      return
    }

    // Skip if follicleId hasn't changed
    if (beforeFollicleId && beforeFollicleId === afterFollicleId) {
      console.log(
        `User ${userId} follicleId unchanged (${afterFollicleId}), skipping`
      )
      return
    }

    console.log(
      `📊 FollicleId changed: ${beforeFollicleId || 'none'} → ${afterFollicleId}`
    )

    // Decode follicleId to get HairAnalysis for scoring
    const hairAnalysis = decodeFollicleIdToAnalysis(afterFollicleId)
    if (!hairAnalysis) {
      console.error(`User ${userId} has invalid follicleId: ${afterFollicleId}`)
      return
    }

    try {
      // 1. Fetch all products
      const productsSnapshot = await db.collection('products').get()
      const products: Product[] = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[]

      console.log(`📦 Fetched ${products.length} products`)

      // 2. Score products
      console.log(`🚀 Scoring products for user ${userId}...`)
      const scoredProducts = await matchProductsForUser(
        { hairAnalysis },
        products,
        afterFollicleId
      )
      console.log(`✅ Scored ${scoredProducts.length} products`)

      // 3. Write product scores
      await writeProductScoresToFirestore(userId, scoredProducts)
      console.log(`💾 Saved product scores for user ${userId}`)

      // 4. Fetch all public routines
      const routinesSnapshot = await db
        .collection('routines')
        .where('is_public', '==', true)
        .get()
      const routines: Routine[] = routinesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Routine[]

      console.log(`📋 Fetched ${routines.length} public routines`)

      // 5. Score routines
      console.log(`🚀 Scoring routines for user ${userId}...`)
      const scoredRoutines = await matchRoutinesForUser(
        { hairAnalysis },
        routines,
        afterFollicleId,
        products
      )
      console.log(`✅ Scored ${scoredRoutines.length} routines`)

      // 6. Write routine scores
      await writeRoutineScoresToFirestore(userId, scoredRoutines, products)
      console.log(`💾 Saved routine scores for user ${userId}`)
    } catch (error) {
      console.error(`❌ Error scoring for user ${userId}:`, error)
      throw error
    }
  }
)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Write scored products to user's subcollection
 */
async function writeProductScoresToFirestore(
  userId: string,
  scored: ProductMatchScore[]
): Promise<void> {
  const scoresRef = db
    .collection('users')
    .doc(userId)
    .collection('product_scores')

  await deleteCollection(scoresRef)

  const writeBatches: FirebaseFirestore.WriteBatch[] = []
  let writeBatch = db.batch()
  let writeCount = 0

  scored.forEach((item, index) => {
    const docRef = scoresRef.doc(item.product.id)

    writeBatch.set(docRef, {
      score: item.totalScore,
      rank: index + 1,
      category: item.product.category,
      breakdown: item.breakdown,
      matchReasons: item.matchReasons.slice(
        0,
        MATCH_REASONS_CONFIG.maxReasonsTotal
      ),
      interactionsByTier: item.interactionsByTier || null,
      scoredAt: new Date(),
      productName: item.product.name,
      productBrand: item.product.brand,
      productImageUrl: item.product.image_url || null,
      productPrice: item.product.price || null,
      ingredientRefs: item.product.ingredient_refs || [],
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
    `✅ Wrote ${scored.length} product scores in ${writeBatches.length} batches`
  )
}

/**
 * Write scored routines to user's subcollection
 */
async function writeRoutineScoresToFirestore(
  userId: string,
  scored: RoutineMatchScore[],
  allProducts: Product[]
): Promise<void> {
  const scoresRef = db
    .collection('users')
    .doc(userId)
    .collection('routine_scores')

  await deleteCollection(scoresRef)

  const writeBatches: FirebaseFirestore.WriteBatch[] = []
  let writeBatch = db.batch()
  let writeCount = 0

  scored.forEach((item, index) => {
    const docRef = scoresRef.doc(item.routine.id)

    writeBatch.set(docRef, {
      score: item.totalScore,
      rank: index + 1,
      breakdown: item.breakdown,
      matchReasons:
        item.matchReasons.slice(0, MATCH_REASONS_CONFIG.maxReasonsTotal) || [],
      interactionsByTier: item.interactionsByTier || null,
      scoredAt: new Date(),
      // Routine card fields
      routineName: item.routine.name,
      routineStepCount: item.routine.steps.length,
      routineFrequency: item.routine.frequency,
      routineUserId: item.routine.user_id,
      routineIsPublic: item.routine.is_public,
      // Steps with product data for card display
      routineSteps: item.routine.steps.slice(0, 3).map((step) => {
        const product = allProducts.find((p) => p.id === step.product_id)
        return {
          order: step.order ?? 0,
          stepName: step.step_name ?? '',
          productId: step.product_id ?? null,
          productName: product?.name ?? null,
          productBrand: product?.brand ?? null,
          productImageUrl: product?.image_url ?? null,
        }
      }),
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
    `✅ Wrote ${scored.length} routine scores in ${writeBatches.length} batches`
  )
}

/**
 * Delete all documents in a collection
 */
async function deleteCollection(
  collectionRef: FirebaseFirestore.CollectionReference
): Promise<void> {
  const existing = await collectionRef.get()

  if (existing.empty) return

  const deleteBatches: FirebaseFirestore.WriteBatch[] = []
  let deleteBatch = db.batch()
  let deleteCount = 0

  existing.docs.forEach((doc) => {
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
  console.log(`🗑️ Deleted ${existing.size} existing scores`)
}
