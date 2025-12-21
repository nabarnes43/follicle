import { notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedProductById } from '@/lib/server/products'
import { getCachedScoresByIds } from '@/lib/server/productScores'
import { ProductDetailClient } from '../../../components/products/ProductDetailClient'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getServerUser()

  // Fetch product from public collection
  const product = await getCachedProductById(id)

  if (!product) {
    notFound()
  }

  // Fetch score only if user has analysis
  const productScore =
    user?.userId && user?.follicleId
      ? (await getCachedScoresByIds(user.userId, [id]))[0] || null
      : null

  return <ProductDetailClient product={product} productScore={productScore} />
}
