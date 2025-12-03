import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedAllScores } from '@/lib/server/productScores'
import { ProductGrid } from '@/components/products/ProductGrid'

/**
 * /products - All products, scored for the user
 *
 * Reads pre-computed scores from users/{userId}/product_scores
 * Scores are computed by Firebase Function when hairAnalysis changes
 */
export default async function ProductsPage() {
  const user = await getServerUser()

  if (!user?.hairAnalysis || !user?.follicleId) {
    redirect('/analysis')
  }

  const products = await getCachedAllScores(user.userId)

  return (
    <ProductGrid
      products={products}
      title="Your Product Recommendations"
      subtitle="Personalized with follicle matching algorithm"
    />
  )
}
