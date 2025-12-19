import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export type EntityType = 'product' | 'routine' | 'ingredient'
export type InteractionType =
  | 'like'
  | 'dislike'
  | 'save'
  | 'view'
  | 'avoid'
  | 'allergic'

// Map interaction types to user cache field names
const CACHE_FIELD_MAP: Record<string, Record<EntityType, string>> = {
  like: {
    product: 'likedProducts',
    routine: 'likedRoutines',
    ingredient: 'likedIngredients',
  },
  dislike: {
    product: 'dislikedProducts',
    routine: 'dislikedRoutines',
    ingredient: 'dislikedIngredients',
  },
  save: {
    product: 'savedProducts',
    routine: 'savedRoutines',
    ingredient: '', // ingredients don't have save
  },
  avoid: {
    product: '', // products don't have avoid
    routine: '', // routines don't have avoid
    ingredient: 'avoidIngredients',
  },
  allergic: {
    product: '', // products don't have allergic
    routine: '', // routines don't have allergic
    ingredient: 'allergicIngredients',
  },
}

/**
 * Get the cache field name for a given interaction type and entity type
 */
function getCacheField(type: string, entityType: EntityType): string | null {
  return CACHE_FIELD_MAP[type]?.[entityType] || null
}

/**
 * Get the opposite interaction type (for mutual exclusivity)
 * Only like/dislike are mutually exclusive
 */
function getOppositeType(type: string): string | null {
  if (type === 'like') return 'dislike'
  if (type === 'dislike') return 'like'
  return null
}

/**
 * Find an opposite interaction (like vs dislike)
 * Returns the document snapshot if found
 */
export async function findOppositeInteraction(
  userId: string,
  entityId: string,
  entityType: EntityType,
  interactionType: string
): Promise<FirebaseFirestore.DocumentSnapshot | null> {
  const oppositeType = getOppositeType(interactionType)
  if (!oppositeType) return null

  const collectionName = `${entityType}_interactions`
  const entityIdField = `${entityType}Id`

  const oppositeQuery = await adminDb
    .collection(collectionName)
    .where('userId', '==', userId)
    .where(entityIdField, '==', entityId)
    .where('type', '==', oppositeType)
    .limit(1)
    .get()

  return oppositeQuery.empty ? null : oppositeQuery.docs[0]
}

/**
 * Create an interaction for a given entity
 * Handles mutual exclusivity (like vs dislike) and user cache updates
 *
 * @param userId - The user creating the interaction
 * @param entityId - The entity ID (product, routine, or ingredient)
 * @param entityType - Type of entity
 * @param interactionType - Type of interaction (like, dislike, save, view, etc.)
 * @param follicleId - User's follicleId
 * @returns The ID of the created interaction
 */
export async function createInteraction(
  userId: string,
  entityId: string,
  entityType: EntityType,
  interactionType: string,
  follicleId: string
): Promise<string> {
  const collectionName = `${entityType}_interactions`
  const entityIdField = `${entityType}Id`

  // Check for opposite interaction (like/dislike mutual exclusivity)
  const oppositeInteractionDoc = await findOppositeInteraction(
    userId,
    entityId,
    entityType,
    interactionType
  )

  const oppositeType = getOppositeType(interactionType)

  // Use batch write for atomic operations
  const batch = adminDb.batch()
  const userRef = adminDb.collection('users').doc(userId)

  // Delete opposite interaction if exists
  if (oppositeInteractionDoc && oppositeType) {
    batch.delete(oppositeInteractionDoc.ref)

    // Remove from user cache
    const oppositeField = getCacheField(oppositeType, entityType)
    if (oppositeField) {
      batch.update(userRef, {
        [oppositeField]: FieldValue.arrayRemove(entityId),
      })
    }
  }

  // Create new interaction
  const newInteractionRef = adminDb.collection(collectionName).doc()
  batch.set(newInteractionRef, {
    userId,
    [entityIdField]: entityId,
    follicleId,
    type: interactionType,
    timestamp: FieldValue.serverTimestamp(),
  })

  // Update user cache (not for views)
  const cacheField = getCacheField(interactionType, entityType)
  if (cacheField) {
    batch.update(userRef, {
      [cacheField]: FieldValue.arrayUnion(entityId),
    })
  }

  await batch.commit()

  return newInteractionRef.id
}

/**
 * Delete an interaction for a given entity
 * Updates user cache arrays
 *
 * @param userId - The user deleting the interaction
 * @param entityId - The entity ID (product, routine, or ingredient)
 * @param entityType - Type of entity
 * @param interactionType - Type of interaction to delete
 * @returns True if interaction was found and deleted, false otherwise
 */
export async function deleteInteraction(
  userId: string,
  entityId: string,
  entityType: EntityType,
  interactionType: string
): Promise<boolean> {
  const collectionName = `${entityType}_interactions`
  const entityIdField = `${entityType}Id`

  // Find the interaction
  const interactionQuery = await adminDb
    .collection(collectionName)
    .where('userId', '==', userId)
    .where(entityIdField, '==', entityId)
    .where('type', '==', interactionType)
    .limit(1)
    .get()

  if (interactionQuery.empty) {
    return false
  }

  const interactionDoc = interactionQuery.docs[0]

  // Use batch write for atomic operations
  const batch = adminDb.batch()

  // Delete interaction
  batch.delete(interactionDoc.ref)

  // Update user cache (not for views)
  const cacheField = getCacheField(interactionType, entityType)
  if (cacheField) {
    const userRef = adminDb.collection('users').doc(userId)
    batch.update(userRef, {
      [cacheField]: FieldValue.arrayRemove(entityId),
    })
  }

  await batch.commit()

  return true
}

/**
 * Check if an interaction already exists
 * Used to prevent duplicate non-view interactions
 *
 * @param userId - The user ID
 * @param entityId - The entity ID
 * @param entityType - Type of entity
 * @param interactionType - Type of interaction
 * @returns True if interaction exists, false otherwise
 */
export async function interactionExists(
  userId: string,
  entityId: string,
  entityType: EntityType,
  interactionType: string
): Promise<boolean> {
  const collectionName = `${entityType}_interactions`
  const entityIdField = `${entityType}Id`

  const existingInteraction = await adminDb
    .collection(collectionName)
    .where('userId', '==', userId)
    .where(entityIdField, '==', entityId)
    .where('type', '==', interactionType)
    .limit(1)
    .get()

  return !existingInteraction.empty
}
