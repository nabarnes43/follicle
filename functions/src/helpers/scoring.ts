import { Product } from '../types/product'
import { Routine } from '../types/routine'
import { matchProductsForUser } from '../products/scoring/productMatcher'
import { matchRoutinesForUser } from '../routines/scoring/routineMatcher'
import { decodeFollicleIdToAnalysis } from '../shared/follicleId'
import { MATCH_REASONS_CONFIG } from '../shared/constants'

/**
 * Fetch all products from Firestore
 */
export async function fetchAllProducts(
  db: FirebaseFirestore.Firestore
): Promise<Product[]> {
  const snapshot = await db.collection('products').get()
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[]
}

/**
 * Fetch all public, non-deleted routines from Firestore
 */
export async function fetchAllPublicRoutines(
  db: FirebaseFirestore.Firestore
): Promise<Routine[]> {
  const snapshot = await db
    .collection('routines')
    .where('is_public', '==', true)
    .get()

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((r: any) => !r.deleted_at) as Routine[]
}

/**
 * Fetch a single routine by ID
 */
export async function fetchRoutineById(
  routineId: string,
  db: FirebaseFirestore.Firestore
): Promise<Routine | null> {
  const doc = await db.collection('routines').doc(routineId).get()

  if (!doc.exists) {
    return null
  }

  return {
    id: doc.id,
    ...doc.data(),
  } as Routine
}

/**
 * Get user's follicleId and decode to HairAnalysis
 */
export async function getUserHairAnalysis(
  userId: string,
  db: FirebaseFirestore.Firestore
) {
  const userDoc = await db.collection('users').doc(userId).get()

  if (!userDoc.exists) {
    return null
  }

  const follicleId = userDoc.data()?.follicleId

  if (!follicleId) {
    return null
  }

  const hairAnalysis = decodeFollicleIdToAnalysis(follicleId)

  if (!hairAnalysis) {
    return null
  }

  return { follicleId, hairAnalysis }
}

/**
 * Score a single product for a single user
 */
export async function scoreProductForUser(
  userId: string,
  product: Product,
  db: FirebaseFirestore.Firestore
): Promise<void> {
  const userAnalysis = await getUserHairAnalysis(userId, db)

  if (!userAnalysis) {
    console.log(`User ${userId} has no valid follicleId, skipping`)
    return
  }

  const { follicleId, hairAnalysis } = userAnalysis

  // If allProducts not provided, we're scoring just one product
  const productToScore = [product]

  const scoredProducts = await matchProductsForUser(
    { hairAnalysis },
    productToScore,
    follicleId,
    db
  )

  const scored = scoredProducts.find((p) => p.product.id === product.id)

  if (!scored) {
    console.error(`Failed to score product ${product.id} for user ${userId}`)
    return
  }

  // Write score
  await db
    .collection('users')
    .doc(userId)
    .collection('product_scores')
    .doc(product.id)
    .set({
      score: scored.totalScore,
      category: scored.product.category,
      breakdown: scored.breakdown,
      matchReasons: scored.matchReasons.slice(
        0,
        MATCH_REASONS_CONFIG.maxReasonsTotal
      ),
      interactionsByTier: scored.interactionsByTier || null,
      scoredAt: new Date(),
      productName: scored.product.name,
      productBrand: scored.product.brand,
      productImageUrl: scored.product.image_url || null,
      productPrice: scored.product.price || null,
      ingredientRefs: scored.product.ingredient_refs || [],
    })
}

/**
 * Score a single routine for a single user
 */
export async function scoreRoutineForUser(
  userId: string,
  routine: Routine,
  db: FirebaseFirestore.Firestore
): Promise<void> {
  const userAnalysis = await getUserHairAnalysis(userId, db)

  if (!userAnalysis) {
    console.log(`User ${userId} has no valid follicleId, skipping`)
    return
  }

  const { follicleId, hairAnalysis } = userAnalysis

  //Fetch only products in this routine
  const productIds = routine.steps
    .map((step) => step.product_id)
    .filter(Boolean)
  const products: Product[] = []

  for (const productId of productIds) {
    const doc = await db.collection('products').doc(productId).get()
    if (doc.exists) {
      products.push({ id: doc.id, ...doc.data() } as Product)
    }
  }

  console.log(
    `📦 Fetched ${products.length} products for routine ${routine.id}`
  )

  const scoredRoutines = await matchRoutinesForUser(
    { hairAnalysis },
    [routine],
    follicleId,
    products,
    db
  )

  if (scoredRoutines.length === 0) {
    console.error(`Failed to score routine ${routine.id} for user ${userId}`)
    return
  }

  const scored = scoredRoutines[0]

  // Write score
  await db
    .collection('users')
    .doc(userId)
    .collection('routine_scores')
    .doc(routine.id)
    .set({
      score: scored.totalScore,
      breakdown: scored.breakdown,
      matchReasons: scored.matchReasons.slice(
        0,
        MATCH_REASONS_CONFIG.maxReasonsTotal
      ),
      interactionsByTier: scored.interactionsByTier || null,
      scoredAt: new Date(),
      routineName: scored.routine.name,
      routineStepCount: scored.routine.steps.length,
      routineFrequency: scored.routine.frequency,
      routineUserId: scored.routine.user_id,
      routineIsPublic: scored.routine.is_public,
      routineSteps: scored.routine.steps.slice(0, 3).map((step) => {
        const product = products.find((p) => p.id === step.product_id)
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

  console.log(`✅ WROTE score for routine ${routine.id} to Firestore`) // ← Ad
}

/**
 * Score all products for a single user
 */
export async function scoreAllProductsForUser(
  userId: string,
  db: FirebaseFirestore.Firestore
): Promise<void> {
  const userAnalysis = await getUserHairAnalysis(userId, db)

  if (!userAnalysis) {
    console.log(`User ${userId} has no valid follicleId, skipping`)
    return
  }

  const { follicleId, hairAnalysis } = userAnalysis

  const products = await fetchAllProducts(db)
  console.log(`📦 Fetched ${products.length} products for user ${userId}`)

  const scoredProducts = await matchProductsForUser(
    { hairAnalysis },
    products,
    follicleId,
    db
  )

  // Delete existing scores
  const scoresRef = db
    .collection('users')
    .doc(userId)
    .collection('product_scores')

  const existing = await scoresRef.get()
  const deleteBatch = db.batch()
  existing.docs.forEach((doc) => deleteBatch.delete(doc.ref))
  if (!existing.empty) {
    await deleteBatch.commit()
  }

  // Write new scores in batches
  const writeBatches: FirebaseFirestore.WriteBatch[] = []
  let writeBatch = db.batch()
  let writeCount = 0

  scoredProducts.forEach((item, index) => {
    const docRef = scoresRef.doc(item.product.id)

    writeBatch.set(docRef, {
      score: item.totalScore,
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
    `✅ Wrote ${scoredProducts.length} product scores for user ${userId}`
  )
}

/**
 * Score all routines for a single user
 */
export async function scoreAllRoutinesForUser(
  userId: string,
  db: FirebaseFirestore.Firestore
): Promise<void> {
  const userAnalysis = await getUserHairAnalysis(userId, db)

  if (!userAnalysis) {
    console.log(`User ${userId} has no valid follicleId, skipping`)
    return
  }

  const { follicleId, hairAnalysis } = userAnalysis

  const products = await fetchAllProducts(db)
  const routines = await fetchAllPublicRoutines(db)

  console.log(
    `📋 Fetched ${routines.length} public routines for user ${userId}`
  )

  const scoredRoutines = await matchRoutinesForUser(
    { hairAnalysis },
    routines,
    follicleId,
    products,
    db
  )

  // Delete existing scores
  const scoresRef = db
    .collection('users')
    .doc(userId)
    .collection('routine_scores')

  const existing = await scoresRef.get()
  const deleteBatch = db.batch()
  existing.docs.forEach((doc) => deleteBatch.delete(doc.ref))
  if (!existing.empty) {
    await deleteBatch.commit()
  }

  // Write new scores in batches
  const writeBatches: FirebaseFirestore.WriteBatch[] = []
  let writeBatch = db.batch()
  let writeCount = 0

  scoredRoutines.forEach((item, index) => {
    const docRef = scoresRef.doc(item.routine.id)

    writeBatch.set(docRef, {
      score: item.totalScore,
      breakdown: item.breakdown,
      matchReasons: item.matchReasons.slice(
        0,
        MATCH_REASONS_CONFIG.maxReasonsTotal
      ),
      interactionsByTier: item.interactionsByTier || null,
      scoredAt: new Date(),
      routineName: item.routine.name,
      routineStepCount: item.routine.steps.length,
      routineFrequency: item.routine.frequency,
      routineUserId: item.routine.user_id,
      routineIsPublic: item.routine.is_public,
      routineSteps: item.routine.steps.slice(0, 3).map((step) => {
        const product = products.find((p) => p.id === step.product_id)
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
    `✅ Wrote ${scoredRoutines.length} routine scores for user ${userId}`
  )
}
