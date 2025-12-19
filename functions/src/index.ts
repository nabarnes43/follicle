import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { onRequest } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'

import {
  scoreProductForUser,
  scoreRoutineForUser,
  scoreAllProductsForUser,
  scoreAllRoutinesForUser,
} from './helpers/scoring'
import { Routine } from './types/routine'
import { Product } from './types/product'

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
// PRODUCT SCORING TRIGGERS
// ============================================================================

/**
 * When a product is created/updated, score it for all users
 */
export const onProductWrite = onDocumentWritten(
  {
    document: 'products/{productId}',
    memory: '1GiB',
    timeoutSeconds: 540,
  },
  async (event) => {
    const productId = event.params.productId
    const afterData = event.data?.after.data()

    // Skip if product was deleted
    if (!afterData) {
      console.log(`Product ${productId} deleted, removing from all user scores`)

      // Remove from all user scores
      const usersSnapshot = await db.collection('users').get()
      const deleteBatch = db.batch()

      for (const userDoc of usersSnapshot.docs) {
        const scoreRef = db
          .collection('users')
          .doc(userDoc.id)
          .collection('product_scores')
          .doc(productId)

        deleteBatch.delete(scoreRef)
      }

      await deleteBatch.commit()
      console.log(`✅ Removed product ${productId} from all user scores`)
      return
    }

    const product = { id: productId, ...afterData }

    console.log(`📦 Product ${productId} changed, scoring for all users`)

    try {
      // Get all users with follicleIds
      const usersSnapshot = await db
        .collection('users')
        .where('follicleId', '!=', null)
        .get()

      console.log(`👥 Scoring product for ${usersSnapshot.size} users`)

      // Score in batches of 10
      const batchSize = 10
      const userIds = usersSnapshot.docs.map((doc) => doc.id)

      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize)

        await Promise.all(
          batch.map(async (userId) => {
            try {
              await scoreProductForUser(userId, product as any, db)
              console.log(`✅ Scored product ${productId} for user ${userId}`)
            } catch (error) {
              console.error(`❌ Error scoring for user ${userId}:`, error)
            }
          })
        )
      }

      console.log(`✅ Finished scoring product ${productId}`)
    } catch (error) {
      console.error(`❌ Error in onProductWrite:`, error)
      throw error
    }
  }
)

// ============================================================================
// PRODUCT INTERACTION TRIGGERS
// ============================================================================

/**
 * When a product interaction is created/deleted, rescore that product for ALL users
 * This handles: like, dislike, save, routine interactions
 * Skips views but still logs for analytics
 * Ensures product scores stay up-to-date globally
 */
export const onProductInteractionWrite = onDocumentWritten(
  {
    document: 'product_interactions/{interactionId}',
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async (event) => {
    const interactionId = event.params.interactionId
    const afterData = event.data?.after.data()
    const beforeData = event.data?.before.data()

    // Get productId from interaction
    const productId = afterData?.productId || beforeData?.productId
    const interactionType = afterData?.type || beforeData?.type

    if (!productId) {
      console.error('No productId found in interaction data')
      return
    }

    // Skip views (analytics only, don't trigger global rescore)
    if (interactionType === 'view') {
      console.log(
        `View interaction for product ${productId}, skipping global rescore`
      )
      return
    }

    console.log(
      `Product interaction ${interactionId} changed for product ${productId}`
    )

    try {
      // Fetch just this ONE product
      const productDoc = await db.collection('products').doc(productId).get()

      if (!productDoc.exists) {
        console.error(`Product ${productId} not found`)
        return
      }

      const product = { ...(productDoc.data() as Product) }

      console.log(`📦 Fetched product: ${product.name}`)

      // Get all users with follicleIds
      const usersSnapshot = await db
        .collection('users')
        .where('follicleId', '!=', null)
        .get()

      console.log(
        `👥 Rescoring product ${productId} for ${usersSnapshot.size} users`
      )

      // Score in batches of 10
      const batchSize = 10
      const userIds = usersSnapshot.docs.map((doc) => doc.id)

      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize)

        await Promise.all(
          batch.map(async (userId) => {
            try {
              await scoreProductForUser(userId, product as Product, db)
              console.log(`✅ Rescored product ${productId} for user ${userId}`)
            } catch (error) {
              console.error(`❌ Error rescoring for user ${userId}:`, error)
            }
          })
        )
      }

      console.log(`✅ Finished rescoring product ${productId}`)
    } catch (error) {
      console.error(`❌ Error in onProductInteractionWrite:`, error)
      throw error
    }
  }
)

// ============================================================================
// ROUTINE INTERACTION TRIGGERS
// ============================================================================

/**
 * When a routine interaction is created/deleted, rescore that routine for ALL users
 * This handles: like, dislike, save, adapt interactions
 * Skips views but still logs for analytics
 * Ensures routine scores stay up-to-date globally
 */
export const onRoutineInteractionWrite = onDocumentWritten(
  {
    document: 'routine_interactions/{interactionId}',
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async (event) => {
    const interactionId = event.params.interactionId
    const afterData = event.data?.after.data()
    const beforeData = event.data?.before.data()

    // Get routineId from interaction
    const routineId = afterData?.routineId || beforeData?.routineId
    const interactionType = afterData?.type || beforeData?.type

    if (!routineId) {
      console.error('No routineId found in interaction data')
      return
    }

    // Skip views (analytics only, don't trigger global rescore)
    if (interactionType === 'view') {
      console.log(
        `View interaction for routine ${routineId}, skipping global rescore`
      )
      return
    }

    console.log(
      `Routine interaction ${interactionId} changed for routine ${routineId}`
    )

    try {
      // Fetch just this ONE routine
      const routineDoc = await db.collection('routines').doc(routineId).get()

      if (!routineDoc.exists) {
        console.error(`Routine ${routineId} not found`)
        return
      }

      const routine = { id: routineId, ...routineDoc.data() } as Routine

      // Skip if routine is deleted or private
      if (routine.deleted_at) {
        console.log(`Routine ${routineId} is deleted, skipping`)
        return
      }

      if (!routine.is_public) {
        console.log(`Routine ${routineId} is private, skipping global rescore`)
        // Only score for owner
        try {
          await scoreRoutineForUser(routine.user_id, routine, db)
          console.log(
            `✅ Rescored private routine for owner ${routine.user_id}`
          )
        } catch (error) {
          console.error(`❌ Error rescoring for owner:`, error)
        }
        return
      }

      console.log(`📋 Fetched routine: ${routine.name}`)

      // Get all users with follicleIds
      const usersSnapshot = await db
        .collection('users')
        .where('follicleId', '!=', null)
        .get()

      console.log(
        `👥 Rescoring routine ${routineId} for ${usersSnapshot.size} users`
      )

      // Score in batches of 10
      const batchSize = 10
      const userIds = usersSnapshot.docs.map((doc) => doc.id)

      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize)

        await Promise.all(
          batch.map(async (userId) => {
            try {
              await scoreRoutineForUser(userId, routine, db)
              console.log(`✅ Rescored routine ${routineId} for user ${userId}`)
            } catch (error) {
              console.error(`❌ Error rescoring for user ${userId}:`, error)
            }
          })
        )
      }

      console.log(`✅ Finished rescoring routine ${routineId}`)
    } catch (error) {
      console.error(`❌ Error in onRoutineInteractionWrite:`, error)
      throw error
    }
  }
)

// ============================================================================
// ROUTINE SCORING TRIGGERS
// ============================================================================

/**
 * When a routine is created/updated/deleted, score it for relevant users
 * - Private routines: Score only for owner
 * - Public routines: Score for all users
 * - Public→Private: Remove from non-owners' scores
 *
 * Note: Product rescoring is handled automatically by onProductInteractionWrite
 */
export const onRoutineWrite = onDocumentWritten(
  {
    document: 'routines/{routineId}',
    memory: '1GiB',
    timeoutSeconds: 540,
  },
  async (event) => {
    const routineId = event.params.routineId
    const beforeData = event.data?.before.data()
    const afterData = event.data?.after.data()

    // CASE 1: Routine was deleted
    if (!afterData) {
      console.log(`Routine ${routineId} deleted, removing from all user scores`)

      const usersSnapshot = await db.collection('users').get()
      const deleteBatch = db.batch()

      for (const userDoc of usersSnapshot.docs) {
        const scoreRef = db
          .collection('users')
          .doc(userDoc.id)
          .collection('routine_scores')
          .doc(routineId)

        deleteBatch.delete(scoreRef)
      }

      await deleteBatch.commit()
      console.log(`✅ Removed routine ${routineId} from all user scores`)
      return
    }

    const routine = { id: routineId, ...afterData } as Routine
    const wasPublic = beforeData?.is_public === true
    const isPublic = routine.is_public === true
    const isDeleted = routine.deleted_at !== null
    const ownerId = routine.user_id

    console.log(`📋 Routine ${routineId} changed:`, {
      wasPublic,
      isPublic,
      isDeleted,
      ownerId,
    })

    // CASE 2: Routine is soft-deleted
    if (isDeleted) {
      console.log(`Routine ${routineId} is soft-deleted, skipping`)
      return
    }

    // CASE 3: Public → Private transition
    if (wasPublic && !isPublic) {
      console.log(`Routine ${routineId} changed from public to private`)

      // Remove from all users except owner
      const usersSnapshot = await db.collection('users').get()
      const batch = db.batch()

      for (const userDoc of usersSnapshot.docs) {
        if (userDoc.id === ownerId) continue // Skip owner

        const scoreRef = db
          .collection('users')
          .doc(userDoc.id)
          .collection('routine_scores')
          .doc(routineId)

        batch.delete(scoreRef)
      }

      await batch.commit()
      console.log(`✅ Removed private routine from non-owners' scores`)

      // Still need to rescore for owner
      try {
        await scoreRoutineForUser(ownerId, routine, db)
        console.log(`✅ Rescored private routine for owner ${ownerId}`)
      } catch (error) {
        console.error(`❌ Error rescoring for owner:`, error)
      }

      return
    }

    // CASE 4: Normal routine scoring (create, edit, or private→public)
    try {
      // Determine who needs this routine scored
      let usersToScore: string[] = []

      if (isPublic) {
        // PUBLIC: Score for all users
        console.log(`Public routine - scoring for all users`)

        const usersSnapshot = await db
          .collection('users')
          .where('follicleId', '!=', null)
          .get()

        usersToScore = usersSnapshot.docs.map((doc) => doc.id)
      } else {
        // PRIVATE: Score only for owner
        console.log(`Private routine - scoring only for owner ${ownerId}`)
        usersToScore = [ownerId]
      }

      console.log(`👥 Scoring routine for ${usersToScore.length} users`)

      // Score routine in batches of 10
      const batchSize = 10

      for (let i = 0; i < usersToScore.length; i += batchSize) {
        const batch = usersToScore.slice(i, i + batchSize)

        await Promise.all(
          batch.map(async (userId) => {
            try {
              await scoreRoutineForUser(userId, routine, db)
              console.log(`✅ Scored routine ${routineId} for user ${userId}`)
            } catch (error) {
              console.error(
                `❌ Error scoring routine for user ${userId}:`,
                error
              )
            }
          })
        )
      }

      console.log(`✅ Finished scoring routine ${routineId}`)

      // Product rescoring is handled automatically by onProductInteractionWrite
      // when product interactions are created/updated/deleted
    } catch (error) {
      console.error(`❌ Error in onRoutineWrite:`, error)
      throw error
    }
  }
)

// ============================================================================
// USER ANALYSIS CHANGE TRIGGER
// ============================================================================

/**
 * When user's follicleId changes (quiz completed/retaken), rescore everything
 */
export const onUserAnalysisChange = onDocumentWritten(
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
      console.log(`User ${userId} follicleId unchanged, skipping`)
      return
    }

    console.log(
      `📊 FollicleId changed for user ${userId}: ${beforeFollicleId || 'none'} → ${afterFollicleId}`
    )

    try {
      // Rescore all products for this user
      console.log(`🚀 Scoring products for user ${userId}...`)
      await scoreAllProductsForUser(userId, db)

      // Rescore all routines for this user
      console.log(`🚀 Scoring routines for user ${userId}...`)
      await scoreAllRoutinesForUser(userId, db)

      console.log(`✅ Finished rescoring everything for user ${userId}`)
    } catch (error) {
      console.error(`❌ Error rescoring for user ${userId}:`, error)
      throw error
    }
  }
)

// ============================================================================
// SCHEDULED DAILY RESCORE (TODO)
// ============================================================================

/**
 * TODO: Daily full rescore for all users
 * Run at 3 AM UTC when traffic is low
 */
export const scheduledDailyRescore = onSchedule(
  {
    schedule: 'every day 03:00',
    timeZone: 'UTC',
    memory: '2GiB',
    timeoutSeconds: 540,
  },
  async (event) => {
    console.log('📅 Starting daily full rescore (TODO: implement logic)')

    // TODO: Decide on logic
    // - Rescore all users?
    // - Only active users (last 30 days)?
    // - Recalculate ranks?

    console.log('✅ Daily rescore placeholder completed')
  }
)
