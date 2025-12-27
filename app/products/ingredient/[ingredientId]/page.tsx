import { notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { adminDb } from '@/lib/firebase/admin'
import { getCachedScoresByIngredient } from '@/lib/server/productScores'
import { getCachedProductsByIngredient } from '@/lib/server/products'
import { ProductGrid } from '@/components/products/ProductGrid'
import { Header } from '@/components/navigation/Header'
import { AnalysisPromptModal } from '@/components/analysis/AnalysisPromptModal'

export default async function IngredientProductsPage({
  params,
}: {
  params: Promise<{ ingredientId: string }>
}) {
  const { ingredientId } = await params
  const user = await getServerUser()

  const ingredientDoc = await adminDb
    .collection('ingredients')
    .doc(ingredientId)
    .get()

  if (!ingredientDoc.exists) {
    notFound()
  }

  const ingredient = ingredientDoc.data()
  const ingredientName = ingredient?.inciName || ingredientId

  // If user has analysis, show scored products
  if (user?.follicleId) {
    const products = await getCachedScoresByIngredient(
      user.userId,
      ingredientId
    )

    return (
      <div>
        <Header
          title={`Products with ${ingredientName}`}
          subtitle={`${products.length} products containing this ingredient`}
        />
        <ProductGrid products={products} />
      </div>
    )
  }

  // Otherwise, show all products without scores
  const rawProducts = await getCachedProductsByIngredient(ingredientId)

  // Convert to expected format
  const productsWithoutScores = rawProducts.map((product) => ({
    product: {
      id: product.id,
      name: product.name,
      brand: product.brand,
      image_url: product.image_url,
      price: product.price,
      category: product.category,
    }
  }))

  return (
    <div>
      <AnalysisPromptModal
        shouldShow={!user?.follicleId}
        isAnonymous={user?.isAnonymous}
      />
      <Header
        title={`Products with ${ingredientName}`}
        subtitle={`${rawProducts.length} products containing this ingredient`}
      />
      <ProductGrid products={productsWithoutScores} hideSaveButton={true} />
    </div>
  )
}
