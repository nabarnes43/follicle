import { Product } from '../types/product'
import { Routine } from '../types/routine'
import { matchProductsForUser } from '../products/scoring/productMatcher'
import { matchRoutinesForUser } from '../routines/scoring/routineMatcher'
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
 * Result from paginated product fetch
 */
//TODO move this to an interface
interface PaginatedProductResult {
  products: Product[]
  lastDoc: FirebaseFirestore.DocumentSnapshot | null
  hasMore: boolean
}

/**
 * Fetch products in chunks for paginated processing
 *
 * @param db - Firestore instance
 * @param cursor - Last document from previous chunk (null for first chunk)
 * @param chunkSize - Number of products to fetch (default 100)
 * @returns Products, cursor for next chunk, and whether more exist
 */
export async function fetchProductChunk(
  db: FirebaseFirestore.Firestore,
  cursor: FirebaseFirestore.DocumentSnapshot | null,
  chunkSize: number = 100
): Promise<PaginatedProductResult> {
  let query = db
    .collection('products')
    .orderBy('__name__') // Consistent ordering for pagination
    .limit(chunkSize)

  if (cursor) {
    query = query.startAfter(cursor)
  }

  const snapshot = await query.get()

  const products = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[]

  return {
    products,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === chunkSize,
  }
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
 * Get user's follicleId
 */
export async function getUserFollicleId(
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

  return follicleId
}

/**
 * Score a single product for a single user
 */
export async function scoreProductForUser(
  userId: string,
  product: Product,
  db: FirebaseFirestore.Firestore
): Promise<void> {
  const follicleId = await getUserFollicleId(userId, db)

  if (!follicleId) {
    console.log(`User ${userId} has no valid follicleId, skipping`)
    return
  }

  // If allProducts not provided, we're scoring just one product
  const productToScore = [product]

  const scoredProducts = await matchProductsForUser(
    productToScore,
    follicleId,
    db
  )

  const scored = scoredProducts.find((p) => p.product.id === product.id)

  if (!scored) {
    console.error(`Failed to score product ${product.id} for user ${userId}`)
    return
  }

  // (before Firestore write)
  console.log(`SCORE BREAKDOWN for product ${product.id} (user ${userId}):`)
  console.log(`  • Total Score: ${scored.totalScore.toFixed(4)}`)
  console.log(
    `  • Engagement Score: ${scored.breakdown.engagementScore.toFixed(4)}`
  )
  console.log(
    `  • Ingredient Score: ${scored.breakdown.ingredientScore?.toFixed(4) || 'N/A'}`
  )
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
  const follicleId = await getUserFollicleId(userId, db)

  if (!follicleId) {
    console.log(`User ${userId} has no valid follicleId, skipping`)
    return
  }

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

  console.log(`Fetched ${products.length} products for routine ${routine.id}`)

  const scoredRoutines = await matchRoutinesForUser(
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

  // (before Firestore write)
  console.log(`SCORE BREAKDOWN for routine ${routine.id} (user ${userId}):`)
  console.log(`  • Total Score: ${scored.totalScore.toFixed(4)}`)
  console.log(
    `  • Engagement Score: ${scored.breakdown.engagementScore.toFixed(4)}`
  )
  console.log(
    `  • Product Score: ${scored.breakdown.productScore?.toFixed(4) || 'N/A'}`
  )

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

  console.log(`WROTE score for routine ${routine.id} to Firestore`)
}

/**
 * Score all products for a single user
 * Uses chunked processing so frontend sees progress within seconds
 * Cleans up orphaned scores at the end (safe for product deletions)
 */
export async function scoreAllProductsForUser(
  userId: string,
  db: FirebaseFirestore.Firestore,
  scoringId: string,
  chunkSize: number
): Promise<void> {
  const follicleId = await getUserFollicleId(userId, db)

  if (!follicleId) {
    console.log(`User ${userId} has no valid follicleId, skipping`)
    return
  }

  const scoresRef = db
    .collection('users')
    .doc(userId)
    .collection('product_scores')

  // ============================================
  // STEP 1: Chunked fetch -> score -> write pipeline
  // ============================================
  let cursor: FirebaseFirestore.DocumentSnapshot | null = null
  let totalProcessed = 0
  let chunkNumber = 0
  const writtenProductIds = new Set<string>()

  // Get total count for logging
  const totalSnapshot = await db.collection('products').count().get()
  const totalProducts = totalSnapshot.data().count
  const expectedChunks = Math.ceil(totalProducts / chunkSize)

  console.log(
    `Starting chunked product scoring for user ${userId} (${totalProducts} products in ~${expectedChunks} chunks)...`
  )

  while (true) {
    chunkNumber++

    // Fetch chunk
    const { products, lastDoc, hasMore } = await fetchProductChunk(
      db,
      cursor,
      chunkSize
    )

    if (products.length === 0) {
      break
    }

    // Score chunk
    const scoredProducts = await matchProductsForUser(products, follicleId, db)

    // Write chunk immediately
    const writeBatch = db.batch()

    scoredProducts.forEach((item) => {
      const docRef = scoresRef.doc(item.product.id)
      writtenProductIds.add(item.product.id)

      writeBatch.set(docRef, {
        scoringId,
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
    })

    await writeBatch.commit()

    totalProcessed += scoredProducts.length

    // Update progress on user doc every chunk and on final chunk
    await db
      .collection('users')
      .doc(userId)
      .collection('scoring_status')
      .doc('current')
      .update({
        products: totalProcessed,
        totalProducts: totalProducts,
      })

    console.log(
      `Product chunk ${chunkNumber}/${expectedChunks}: ${totalProcessed}/${totalProducts} scored`
    )

    // Move cursor or exit
    if (!hasMore) {
      break
    }
    cursor = lastDoc
  }

  // ============================================
  // STEP 2: Clean up orphaned scores
  // ============================================
  const existingScores = await scoresRef.get()
  const orphanIds = existingScores.docs
    .map((doc) => doc.id)
    .filter((id) => !writtenProductIds.has(id))

  if (orphanIds.length > 0) {
    console.log(`Cleaning up ${orphanIds.length} orphaned product scores...`)

    const deleteBatches: FirebaseFirestore.WriteBatch[] = []
    let deleteBatch = db.batch()
    let deleteCount = 0

    orphanIds.forEach((id) => {
      deleteBatch.delete(scoresRef.doc(id))
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
    console.log(`Deleted ${orphanIds.length} orphaned product scores`)
  }

  // ============================================
  // STEP 3: Verify final count
  // ============================================
  const finalCount = await scoresRef.count().get()
  const actualCount = finalCount.data().count

  console.log(`Completed: ${totalProcessed} product scores for user ${userId}`)
  console.log(`Verified: ${actualCount} product scores in database`)

  if (actualCount !== totalProcessed) {
    console.error(`MISMATCH: Expected ${totalProcessed}, got ${actualCount}`)
  }
}

/**
 * Fetch routines in chunks for paginated processing
 */
async function fetchRoutineChunk(
  db: FirebaseFirestore.Firestore,
  cursor: FirebaseFirestore.DocumentSnapshot | null,
  chunkSize: number = 23
): Promise<{
  routines: Routine[]
  lastDoc: FirebaseFirestore.DocumentSnapshot | null
  hasMore: boolean
}> {
  let query = db
    .collection('routines')
    .where('is_public', '==', true)
    .where('deleted_at', '==', null)
    .orderBy('__name__')
    .limit(chunkSize)

  if (cursor) {
    query = query.startAfter(cursor)
  }

  const snapshot = await query.get()

  const routines = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Routine[]

  return {
    routines,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === chunkSize,
  }
}

/**
 * Score all routines for a single user
 * Uses chunked processing for consistency with products
 */
export async function scoreAllRoutinesForUser(
  userId: string,
  db: FirebaseFirestore.Firestore,
  scoringId: string,
  chunkSize: number
): Promise<void> {
  const follicleId = await getUserFollicleId(userId, db)

  if (!follicleId) {
    console.log(`User ${userId} has no valid follicleId, skipping`)
    return
  }

  // Fetch all products once (needed for routine scoring)
  const products = await fetchAllProducts(db)

  const scoresRef = db
    .collection('users')
    .doc(userId)
    .collection('routine_scores')

  // ============================================
  // STEP 1: Chunked fetch -> score -> write pipeline
  // ============================================
  let cursor: FirebaseFirestore.DocumentSnapshot | null = null
  let totalProcessed = 0
  let chunkNumber = 0
  const writtenRoutineIds = new Set<string>()

  // Get total count for logging
  const totalRoutinesSnapshot = await db
    .collection('routines')
    .where('is_public', '==', true)
    .where('deleted_at', '==', null)
    .count()
    .get()
  const totalRoutines = totalRoutinesSnapshot.data().count
  const expectedChunks = Math.ceil(totalRoutines / chunkSize)

  console.log(
    `Starting chunked routine scoring for user ${userId} (${totalRoutines} routines in ~${expectedChunks} chunks)...`
  )

  while (true) {
    chunkNumber++

    // Fetch chunk
    const { routines, lastDoc, hasMore } = await fetchRoutineChunk(
      db,
      cursor,
      chunkSize
    )

    if (routines.length === 0) {
      break
    }

    // Score chunk
    const scoredRoutines = await matchRoutinesForUser(
      routines,
      follicleId,
      products,
      db
    )

    // Write chunk immediately
    const writeBatch = db.batch()

    scoredRoutines.forEach((item) => {
      const docRef = scoresRef.doc(item.routine.id)
      writtenRoutineIds.add(item.routine.id)

      writeBatch.set(docRef, {
        scoringId,
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
    })

    await writeBatch.commit()

    totalProcessed += scoredRoutines.length

    // Update progress on user doc every chunk and on final chunk
    await db
      .collection('users')
      .doc(userId)
      .collection('scoring_status')
      .doc('current')
      .update({
        routines: totalProcessed,
        totalRoutines: totalRoutines,
      })

    console.log(
      `Routine chunk ${chunkNumber}/${expectedChunks}: ${totalProcessed}/${totalRoutines} scored`
    )

    // Move cursor or exit
    if (!hasMore) {
      break
    }
    cursor = lastDoc
  }

  // ============================================
  // STEP 2: Clean up orphaned scores
  // ============================================
  const existingScores = await scoresRef.get()
  const orphanIds = existingScores.docs
    .map((doc) => doc.id)
    .filter((id) => !writtenRoutineIds.has(id))

  if (orphanIds.length > 0) {
    console.log(`Cleaning up ${orphanIds.length} orphaned routine scores...`)

    const deleteBatches: FirebaseFirestore.WriteBatch[] = []
    let deleteBatch = db.batch()
    let deleteCount = 0

    orphanIds.forEach((id) => {
      deleteBatch.delete(scoresRef.doc(id))
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
    console.log(`Deleted ${orphanIds.length} orphaned routine scores`)
  }

  // ============================================
  // STEP 3: Verify final count
  // ============================================
  const finalCount = await scoresRef.count().get()
  const actualCount = finalCount.data().count

  console.log(`Completed: ${totalProcessed} routine scores for user ${userId}`)
  console.log(`Verified: ${actualCount} routine scores in database`)

  if (actualCount !== totalProcessed) {
    console.error(
      `ROUTINE MISMATCH: Expected ${totalProcessed}, got ${actualCount}`
    )
  }
}
