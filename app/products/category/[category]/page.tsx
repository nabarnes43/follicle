import { notFound } from 'next/navigation'
import { getServerUser } from '@/lib/server/auth'
import { getCachedScoresByCategory } from '@/lib/server/productScores'
import { getCachedProductsByCategory } from '@/lib/server/products'
import { ProductGrid } from '@/components/products/ProductGrid'
import { PRODUCT_CATEGORIES } from '@/lib/constants/categories'
import { Header } from '@/components/navigation/Header'

export default async function CategoryProductsPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const user = await getServerUser()

  const decodedCategory = decodeURIComponent(category)

  if (!PRODUCT_CATEGORIES.includes(decodedCategory as any)) {
    notFound()
  }

  // If user has analysis, show scored products
  if (user?.follicleId) {
    const products = await getCachedScoresByCategory(
      user.userId,
      decodedCategory
    )

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

  // Otherwise, show all products in category without scores
  const products = await getCachedProductsByCategory(decodedCategory)

  // Convert to expected format
  const productsWithoutScores = products.map((product) => ({
    product: {
      id: product.id,
      name: product.name,
      brand: product.brand,
      image_url: product.image_url,
      price: product.price,
      category: product.category,
    },
  }))

  return (
    <div>
      <Header
        title={decodedCategory}
        subtitle={`${products.length} products in this category`}
      />
      <ProductGrid products={productsWithoutScores} hideSaveButton={true} />
    </div>
  )
}
