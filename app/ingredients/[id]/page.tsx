import { notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedIngredientById } from '@/lib/server/ingredients'
import { getCachedScoresByIngredient } from '@/lib/server/productScores'
import { getCachedProductsByIngredient } from '@/lib/server/products'
import { IngredientDetailClient } from '@/components/ingredients/IngredientDetailClient'
import { AnalysisPromptModal } from '@/components/analysis/AnalysisPromptModal'

export default async function IngredientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getServerUser()

  // Fetch ingredient (public data)
  const ingredient = await getCachedIngredientById(id)

  if (!ingredient) {
    notFound()
  }

  // Fetch products containing this ingredient
  let products = []

  if (user?.userId && user?.follicleId) {
    // Authenticated: fetch scored products
    products = await getCachedScoresByIngredient(user.userId, id, { limit: 6 })
  } else {
    // Not authenticated: fetch products without scores
    const rawProducts = await getCachedProductsByIngredient(id, { limit: 6 })

    // Convert to expected format
    products = rawProducts.map((product) => ({
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        image_url: product.image_url,
        price: product.price,
        category: product.category,
      },
    }))
    console.log('🔍 Products after mapping:', products.length)
  }

  return (
    <>
      <AnalysisPromptModal
        shouldShow={!user?.follicleId}
        isAnonymous={user?.isAnonymous}
      />
      <IngredientDetailClient
        ingredient={ingredient}
        products={products}
        hideSaveButton={!user?.follicleId}
      />
    </>
  )
}
