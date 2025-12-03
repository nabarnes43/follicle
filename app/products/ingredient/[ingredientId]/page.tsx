import { redirect, notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { adminDb } from '@/lib/firebase/admin'
import { getCachedScoresByIngredient } from '@/lib/server/productScores'
import { ProductGrid } from '@/components/products/ProductGrid'

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

  const products = await getCachedScoresByIngredient(user.userId, ingredientId)

  return (
    <ProductGrid
      products={products}
      title={`Products with ${ingredientName}`}
      subtitle={`${products.length} products containing this ingredient`}
      emptyMessage={`No products found containing ${ingredientName}`}
    />
  )
}
