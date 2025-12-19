import { notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedIngredientById } from '@/lib/server/ingredients'
import { getCachedScoresByIngredient } from '@/lib/server/productScores'
import { IngredientDetailClient } from '@/components/ingredients/IngredientDetailClient'

export default async function IngredientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getServerUser()

  // Fetch ingredient
  const ingredient = await getCachedIngredientById(id)

  if (!ingredient) {
    notFound()
  }

  // Fetch products containing this ingredient (if user has analysis)
  const products =
    user?.userId && user?.follicleId
      ? await getCachedScoresByIngredient(user.userId, id, { limit: 6 })
      : []

  return (
    <IngredientDetailClient
      ingredient={ingredient}
      products={products}
      userId={user?.userId}
    />
  )
}
