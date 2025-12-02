import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { adminDb } from '@/lib/firebase/admin'
import { ProductGrid } from '@/components/products/ProductGrid'
import { PreComputedProductMatchScore } from '@/types/productMatching'

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

  const scoresSnapshot = await adminDb
    .collection('users')
    .doc(user.userId)
    .collection('product_scores')
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
      title="Your Product Recommendations"
      subtitle="Personalized with follicle matching algorithm"
    />
  )
}
