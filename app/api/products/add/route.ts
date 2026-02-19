import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuthToken } from '@/lib/firebase/auth'
import { PRODUCT_CATEGORIES, ProductCategory } from '@/lib/constants/categories'

// Generate doc ID in same format as existing products e.g. "100_pure_glossy_locks_glossing_shampoo"
function generateProductId(brand: string, name: string): string {
  return `${brand}_${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

// Match ingredient names against the ingredients collection by inciName
async function resolveIngredientRefs(ingredientList: string[]): Promise<{
  ingredient_refs: (string | null)[]
  unmapped_ingredients: string[]
}> {
  if (ingredientList.length === 0) {
    return { ingredient_refs: [], unmapped_ingredients: [] }
  }

  const ingredient_refs: (string | null)[] = []
  const unmapped_ingredients: string[] = []

  for (const ingredient of ingredientList) {
    const normalized = ingredient.toUpperCase().trim()

    const snapshot = await adminDb
      .collection('ingredients')
      .where('inciName', '==', normalized)
      .limit(1)
      .get()

    if (!snapshot.empty) {
      ingredient_refs.push(snapshot.docs[0].id)
    } else {
      ingredient_refs.push(null)
      unmapped_ingredients.push(ingredient)
    }
  }

  return { ingredient_refs, unmapped_ingredients }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await verifyAuthToken(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, brand, category, ingredients, image_url, affiliate_url } =
      body

    // Validate required fields
    if (!name?.trim() || !brand?.trim() || !category) {
      return NextResponse.json(
        { error: 'Name, brand, and category are required' },
        { status: 400 }
      )
    }

    if (!PRODUCT_CATEGORIES.includes(category as ProductCategory)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Generate doc ID and check for duplicate
    const productId = generateProductId(brand, name)
    const existingDoc = await adminDb
      .collection('products')
      .doc(productId)
      .get()

    if (existingDoc.exists) {
      return NextResponse.json(
        { duplicate: true, existingProductId: productId },
        { status: 200 }
      )
    }

    // Get username from user doc
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const addedByUserName =
      userDoc.data()?.displayName || userDoc.data()?.email || 'Anonymous'

    // Parse and resolve ingredients
    const ingredientList = ingredients
      ? ingredients
          .split(',')
          .map((i: string) => i.trim())
          .filter(Boolean)
      : []

    const { ingredient_refs, unmapped_ingredients } =
      await resolveIngredientRefs(ingredientList)

    const now = new Date()
    await adminDb
      .collection('products')
      .doc(productId)
      .set({
        name: name.trim(),
        brand: brand.trim(),
        category,
        image_url: image_url?.trim() || null,
        ingredients: ingredientList,
        ingredients_normalized: ingredientList.map((i: string) =>
          i.toUpperCase()
        ),
        ingredient_refs,
        ingredient_count: ingredientList.length,
        unmapped_ingredients,
        price: null,
        rating: null,
        review_count: 0,
        description: null,
        affiliate_url: affiliate_url?.trim() || null,
        data_source: 'user_submission',
        status: 'pending_review',
        addedByUserId: userId,
        addedByUserName,
        created_at: now,
        updated_at: now,
      })

    return NextResponse.json({ success: true, productId }, { status: 201 })
  } catch (error) {
    console.error('Error submitting product:', error)
    return NextResponse.json(
      { error: 'Failed to submit product' },
      { status: 500 }
    )
  }
}
