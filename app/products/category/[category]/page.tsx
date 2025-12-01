import { redirect, notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getFilteredProducts } from '@/lib/server/products'
import { ProductGrid } from '@/components/products/ProductGrid'
import { PRODUCT_CATEGORIES } from '@/lib/matching/products/config/categories'

/**
 * /products/category/[category] - Products filtered by category
 *
 * Much faster than /products because we only fetch and score
 * products in one category (e.g., 500 shampoos vs 8,000 total)
 */
export default async function CategoryProductsPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const user = await getServerUser()

  if (!user?.hairAnalysis || !user?.follicleId) {
    redirect('/analysis')
  }

  // Validate category exists
  // URL uses encoded format (e.g., "Hair%20Masks"), so we decode it
  const decodedCategory = decodeURIComponent(category)

  if (!PRODUCT_CATEGORIES.includes(decodedCategory as any)) {
    notFound()
  }

  const products = await getFilteredProducts(
    { category: decodedCategory },
    user.hairAnalysis,
    user.follicleId
  )

  return (
    <ProductGrid
      products={products}
      title={decodedCategory}
      subtitle={`${products.length} products matched and scored for your hair`}
    />
  )
}
