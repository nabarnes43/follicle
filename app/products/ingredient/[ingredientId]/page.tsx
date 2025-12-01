import { redirect, notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getFilteredProducts } from '@/lib/server/products'
import { ProductGrid } from '@/components/products/ProductGrid'
import { adminDb } from '@/lib/firebase/admin'

/**
 * /products/ingredient/[ingredientId] - Products containing a specific ingredient
 *
 * Shows all products that contain this ingredient, scored for the user
 */
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

  // Fetch ingredient name for the title
  const ingredientDoc = await adminDb
    .collection('ingredients')
    .doc(ingredientId)
    .get()

  if (!ingredientDoc.exists) {
    notFound()
  }

  const ingredient = ingredientDoc.data()
  const ingredientName = ingredient?.inciName || ingredientId

  const products = await getFilteredProducts(
    { ingredientId },
    user.hairAnalysis,
    user.follicleId
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
