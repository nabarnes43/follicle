import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getFilteredProducts } from '@/lib/server/products'
import { ProductGrid } from '@/components/products/ProductGrid'

/**
 * /products - All products, scored for the user
 *
 * Note: This scores ALL 8,000 products which is slower than filtered routes.
 */
export default async function ProductsPage() {
  const user = await getServerUser()

  // No user or no hair analysis - redirect to analysis
  if (!user?.hairAnalysis || !user?.follicleId) {
    redirect('/analysis')
  }

  const products = await getFilteredProducts(
    {}, // No filters - fetch all
    user.hairAnalysis,
    user.follicleId
  )

  return (
    <ProductGrid
      products={products}
      title="Your Product Recommendations"
      subtitle="Personalized with follicle matching algorithm"
    />
  )
}
