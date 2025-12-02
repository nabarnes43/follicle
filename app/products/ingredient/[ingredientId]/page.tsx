import { redirect, notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { adminDb } from '@/lib/firebase/admin'
import { ProductGrid } from '@/components/products/ProductGrid'
import { PreComputedProductMatchScore } from '@/types/productMatching'

export default async function IngredientProductsPage({
  params,
}: {
  params: Promise<{ ingredientId: string }>
}) {
  const { ingredientId } = await params
  const user = await getServerUser()

  if (!user?.hairAnalysis || !user?.follicleId) {
    redirect('/analysis')
  }

  const ingredientDoc = await adminDb
    .collection('ingredients')
    .doc(ingredientId)
    .get()

  if (!ingredientDoc.exists) {
    notFound()
  }

  const ingredient = ingredientDoc.data()
  const ingredientName = ingredient?.inciName || ingredientId

  const scoresSnapshot = await adminDb
    .collection('users')
    .doc(user.userId)
    .collection('product_scores')
    .where('ingredientRefs', 'array-contains', ingredientId)
    .orderBy('rank')
    .get()

  const products: PreComputedProductMatchScore[] = scoresSnapshot.docs.map(
    (doc) => {
      const data = doc.data()
      return {
        product: {
          id: doc.id,
          name: data.productName,
          brand: data.productBrand,
          image_url: data.productImageUrl,
          price: data.productPrice,
          category: data.category,
        },
        totalScore: data.score,
        breakdown: data.breakdown,
        matchReasons: data.matchReasons || [],
      }
    }
  )

  return (
    <ProductGrid
      products={products}
      title={`Products with ${ingredientName}`}
      subtitle={`${products.length} products containing this ingredient`}
      emptyMessage={`No products found containing ${ingredientName}`}
    />
  )
}
