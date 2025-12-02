import { redirect, notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { adminDb } from '@/lib/firebase/admin'
import { ProductGrid } from '@/components/products/ProductGrid'
import { PRODUCT_CATEGORIES } from '@/lib/matching/products/config/categories'
import { PreComputedProductMatchScore } from '@/types/productMatching'

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

  const decodedCategory = decodeURIComponent(category)

  if (!PRODUCT_CATEGORIES.includes(decodedCategory as any)) {
    notFound()
  }

  const scoresSnapshot = await adminDb
    .collection('users')
    .doc(user.userId)
    .collection('product_scores')
    .where('category', '==', decodedCategory)
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
      title={decodedCategory}
      subtitle={`${products.length} products matched for your hair`}
    />
  )
}
