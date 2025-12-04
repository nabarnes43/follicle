import { redirect, notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedScoresByCategory } from '@/lib/server/productScores'
import { ProductGrid } from '@/components/products/ProductGrid'
import { PRODUCT_CATEGORIES } from '@/lib/matching/products/config/categories'
import { Header } from '@/components/navigation/Header'

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

  const products = await getCachedScoresByCategory(user.userId, decodedCategory)

  return (
    <div>
      <Header
        title={decodedCategory}
        subtitle={`${products.length} products matched for your hair`}
      />
      <ProductGrid products={products} />
    </div>
  )
}
