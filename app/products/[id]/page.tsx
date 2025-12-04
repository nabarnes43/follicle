import { notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { adminDb } from '@/lib/firebase/admin'
import { getCachedScoresByIds, serializeProduct } from '@/lib/server/productScores'
import { Product } from '@/types/product'
import { ProductDetailClient } from '../../../components/products/ProductDetailClient'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getServerUser()

  // Fetch product
  const productDoc = await adminDb.collection('products').doc(id).get()

  if (!productDoc.exists) {
    notFound()
  }

  const product = serializeProduct({
    id: productDoc.id,
    ...productDoc.data(),
  }) as Product

  // Fetch score if user logged in (includes matchReasons)
  const productScore = user?.userId
    ? (await getCachedScoresByIds(user.userId, [id]))[0] || null
    : null

  return <ProductDetailClient product={product} productScore={productScore} />
}
