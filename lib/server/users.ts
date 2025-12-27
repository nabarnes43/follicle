import { adminDb } from '@/lib/firebase/admin'
import type { User } from '@/types/user'
import { serializeFirestoreDoc } from './serialization'
import { getCachedScoresByIds } from './productScores'
import { getCachedProductsByIds } from './products'
import { getCachedRoutineScoresByIds } from './routineScores'
import { getCachedRoutineById } from './routines'
import { getCachedIngredientsByIds } from './ingredients'

/**
 * Get ingredient interactions for a profile user
 * Note: Ingredients don't have scores, so we just fetch the raw ingredients
 *
 * @param profileUserId - The user whose profile is being viewed
 * @returns Ingredient interactions (no scores)
 */
export async function getUserIngredientInteractions(profileUserId: string) {
  try {
    const userDoc = await adminDb.collection('users').doc(profileUserId).get()

    if (!userDoc.exists) {
      return null
    }

    const userData = userDoc.data() as User

    // Get ingredient IDs from cache arrays
    const likedIngredientIds = userData.likedIngredients || []
    const dislikedIngredientIds = userData.dislikedIngredients || []
    const avoidIngredientIds = userData.avoidIngredients || []
    const allergicIngredientIds = userData.allergicIngredients || []

    // Fetch ingredients (no scores for ingredients)
    const [liked, disliked, avoid, allergic] = await Promise.all([
      getCachedIngredientsByIds(likedIngredientIds),
      getCachedIngredientsByIds(dislikedIngredientIds),
      getCachedIngredientsByIds(avoidIngredientIds),
      getCachedIngredientsByIds(allergicIngredientIds),
    ])

    return {
      liked,
      disliked,
      avoid,
      allergic,
    }
  } catch (error) {
    console.error('Error fetching user ingredient interactions:', error)
    return null
  }
}

/**
 * Get routine interactions for a profile user, scored for the viewing user
 *
 * @param profileUserId - The user whose profile is being viewed
 * @param viewerUserId - The current user viewing the profile (for scores)
 * @param viewerFollicleId - Viewer's follicleId (required for scores)
 * @returns Routine interactions with viewer's match scores
 */
export async function getUserRoutineInteractionsWithScores(
  profileUserId: string,
  viewerUserId: string | null,
  viewerFollicleId: string | null
) {
  try {
    const userDoc = await adminDb.collection('users').doc(profileUserId).get()

    if (!userDoc.exists) {
      return null
    }

    const userData = userDoc.data() as User
    const isOwnProfile = viewerUserId === profileUserId

    // Helper: Filter to only public routine IDs
    const getPublicRoutineIds = async (
      routineIds: string[]
    ): Promise<string[]> => {
      if (isOwnProfile || routineIds.length === 0) {
        return routineIds // Show all if own profile
      }

      // Fetch routines and filter to public
      const routines = await Promise.all(
        routineIds.map((id) => getCachedRoutineById(id))
      )

      return routines
        .filter(
          (r): r is NonNullable<typeof r> => r !== null && r.is_public === true
        )
        .map((r) => r.id)
    }

    // Get routine IDs and filter to public before fetching scores
    const [
      publicCreatedIds,
      publicSavedIds,
      publicLikedIds,
      publicDislikedIds,
      publicAdaptedIds,
    ] = await Promise.all([
      getPublicRoutineIds(userData.createdRoutines || []),
      getPublicRoutineIds(userData.savedRoutines || []),
      getPublicRoutineIds(userData.likedRoutines || []),
      getPublicRoutineIds(userData.dislikedRoutines || []),
      getPublicRoutineIds(userData.adaptedRoutines || []),
    ])

    // Now fetch scores only for public routines
    if (viewerUserId && viewerFollicleId) {
      const [
        createdScores,
        savedScores,
        likedScores,
        dislikedScores,
        adaptedScores,
      ] = await Promise.all([
        getCachedRoutineScoresByIds(viewerUserId, publicCreatedIds),
        getCachedRoutineScoresByIds(viewerUserId, publicSavedIds),
        getCachedRoutineScoresByIds(viewerUserId, publicLikedIds),
        getCachedRoutineScoresByIds(viewerUserId, publicDislikedIds),
        getCachedRoutineScoresByIds(viewerUserId, publicAdaptedIds),
      ])

      return {
        created: createdScores,
        saved: savedScores,
        liked: likedScores,
        disliked: dislikedScores,
        adapted: adaptedScores,
      }
    } else {
      // Viewer not authenticated
      const [
        createdRoutines,
        savedRoutines,
        likedRoutines,
        dislikedRoutines,
        adaptedRoutines,
      ] = await Promise.all([
        Promise.all(publicCreatedIds.map((id) => getCachedRoutineById(id))),
        Promise.all(publicSavedIds.map((id) => getCachedRoutineById(id))),
        Promise.all(publicLikedIds.map((id) => getCachedRoutineById(id))),
        Promise.all(publicDislikedIds.map((id) => getCachedRoutineById(id))),
        Promise.all(publicAdaptedIds.map((id) => getCachedRoutineById(id))),
      ])

      const toScoreFormat = (routines: (any | null)[]) =>
        routines
          .filter((r): r is NonNullable<typeof r> => r !== null)
          .map((r) => ({
            routine: {
              id: r.id,
              name: r.name,
              stepCount: r.steps?.length || 0,
              frequency: r.frequency,
              isPublic: r.is_public,
              userId: r.user_id,
              steps:
                r.steps?.map((s: any) => ({
                  order: s.order,
                  stepName: s.step_name,
                  productId: s.product_id,
                  productName: s.product_name,
                  productBrand: s.product_brand,
                  productImageUrl: s.product_image_url,
                })) || [],
            },
            totalScore: undefined,
            breakdown: undefined,
            matchReasons: [],
          }))

      return {
        created: toScoreFormat(createdRoutines),
        saved: toScoreFormat(savedRoutines),
        liked: toScoreFormat(likedRoutines),
        disliked: toScoreFormat(dislikedRoutines),
        adapted: toScoreFormat(adaptedRoutines),
      }
    }
  } catch (error) {
    console.error('Error fetching user routine interactions:', error)
    return null
  }
}

/**
 * Get product interactions for a profile user, scored for the viewing user
 *
 * @param profileUserId - The user whose profile is being viewed
 * @param viewerUserId - The current user viewing the profile (for scores)
 * @returns Product interactions with viewer's match scores
 */
export async function getUserProductInteractionsWithScores(
  profileUserId: string,
  viewerUserId: string | null,
  viewerFollicleId: string | null
) {
  try {
    const userDoc = await adminDb.collection('users').doc(profileUserId).get()

    if (!userDoc.exists) {
      return null
    }

    const userData = userDoc.data() as User

    // Get product IDs from cache arrays
    const likedProductIds = userData.likedProducts || []
    const savedProductIds = userData.savedProducts || []
    const dislikedProductIds = userData.dislikedProducts || []

    // If viewer is authenticated, fetch scores for them
    if (viewerUserId && viewerFollicleId) {
      const [likedScores, savedScores, dislikedScores] = await Promise.all([
        getCachedScoresByIds(viewerUserId, likedProductIds),
        getCachedScoresByIds(viewerUserId, savedProductIds),
        getCachedScoresByIds(viewerUserId, dislikedProductIds),
      ])

      return {
        liked: likedScores,
        saved: savedScores,
        disliked: dislikedScores,
      }
    } else {
      // Viewer not authenticated - fetch raw products without scores
      const [likedProducts, savedProducts, dislikedProducts] =
        await Promise.all([
          getCachedProductsByIds(likedProductIds),
          getCachedProductsByIds(savedProductIds),
          getCachedProductsByIds(dislikedProductIds),
        ])

      // Convert to PreComputedProductMatchScore format without scores
      const toScoreFormat = (products: any[]) =>
        products.map((p) => ({
          product: {
            id: p.id,
            name: p.name,
            brand: p.brand,
            image_url: p.image_url,
            price: p.price,
            category: p.category,
          },
          totalScore: undefined,
          breakdown: undefined,
          matchReasons: [],
        }))

      return {
        liked: toScoreFormat(likedProducts),
        saved: toScoreFormat(savedProducts),
        disliked: toScoreFormat(dislikedProducts),
      }
    }
  } catch (error) {
    console.error('Error fetching user product interactions:', error)
    return null
  }
}

export async function getPublicUserProfile(userId: string) {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get()

    if (!userDoc.exists) {
      return null
    }

    const userData = userDoc.data() as User

    // Query TOP-LEVEL collections, not subcollections
    const productInteractionsRef = adminDb.collection('product_interactions')
    const routineInteractionsRef = adminDb.collection('routine_interactions')
    const ingredientInteractionsRef = adminDb.collection(
      'ingredient_interactions'
    )

    // Count by type for each category (exclude views)
    const [
      // Products
      productLikes,
      productDislikes,
      productSaves,
      // Routines
      routineLikes,
      routineDislikes,
      routineSaves,
      // Ingredients
      ingredientLikes,
      ingredientDislikes,
      ingredientAvoids,
      ingredientAllergies,
    ] = await Promise.all([
      // Product interaction counts - filter by userId AND type
      productInteractionsRef
        .where('userId', '==', userId)
        .where('type', '==', 'like')
        .count()
        .get(),
      productInteractionsRef
        .where('userId', '==', userId)
        .where('type', '==', 'dislike')
        .count()
        .get(),
      productInteractionsRef
        .where('userId', '==', userId)
        .where('type', '==', 'save')
        .count()
        .get(),
      // Routine interaction counts
      routineInteractionsRef
        .where('userId', '==', userId)
        .where('type', '==', 'like')
        .count()
        .get(),
      routineInteractionsRef
        .where('userId', '==', userId)
        .where('type', '==', 'dislike')
        .count()
        .get(),
      routineInteractionsRef
        .where('userId', '==', userId)
        .where('type', '==', 'save')
        .count()
        .get(),
      // Ingredient interaction counts
      ingredientInteractionsRef
        .where('userId', '==', userId)
        .where('type', '==', 'like')
        .count()
        .get(),
      ingredientInteractionsRef
        .where('userId', '==', userId)
        .where('type', '==', 'dislike')
        .count()
        .get(),
      ingredientInteractionsRef
        .where('userId', '==', userId)
        .where('type', '==', 'avoid')
        .count()
        .get(),
      ingredientInteractionsRef
        .where('userId', '==', userId)
        .where('type', '==', 'allergic')
        .count()
        .get(),
    ])

    return {
      user: serializeFirestoreDoc<User>(userData),
      stats: {
        products: {
          liked: productLikes.data().count,
          disliked: productDislikes.data().count,
          saved: productSaves.data().count,
        },
        routines: {
          created: userData.createdRoutines?.length || 0,
          liked: routineLikes.data().count,
          disliked: routineDislikes.data().count,
          saved: routineSaves.data().count,
          adapted: userData.adaptedRoutines?.length || 0,
        },
        ingredients: {
          liked: ingredientLikes.data().count,
          disliked: ingredientDislikes.data().count,
          avoided: ingredientAvoids.data().count,
          allergic: ingredientAllergies.data().count,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching public profile:', error)
    return null
  }
}
