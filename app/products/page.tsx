import { getServerUser } from '@/lib/server/auth'
import { getCachedAllScores } from '@/lib/server/productScores'
import { getCachedAllProducts } from '@/lib/server/products'
import { ProductGrid } from '@/components/products/ProductGrid'
import { Header } from '@/components/shared/Header'
import { AnalysisPromptModal } from '@/components/analysis/AnalysisPromptModal'

/**
 * /products - All products
 *
 * Authenticated: Shows scored products from users/{userId}/product_scores
 * Unauthenticated: Shows all products alphabetically (no scores)
 */
export default async function ProductsPage() {
  const user = await getServerUser()

  // If user has analysis, show scored products
  if (user?.follicleId) {
    const products = await getCachedAllScores(user.userId)

    return (
      <div>
        <Header
          title="Products"
          subtitle="Personalized with follicle matching algorithm"
        />
        <ProductGrid products={products} />
      </div>
    )
  }

  // Otherwise, show all products without scores
  const products = await getCachedAllProducts()

  // Convert to expected format (ProductGrid expects PreComputedProductMatchScore[])
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
      {/* Modal will appear after seconds if user has no follicleId */}
      <AnalysisPromptModal
        shouldShow={!user?.follicleId}
        isAnonymous={user?.isAnonymous}
      />
      <Header
        title="Products"
        subtitle={`Browse ${products.length.toLocaleString()} hair care products`}
      />
      <ProductGrid products={productsWithoutScores} hideSaveButton={true} />
    </div>
  )
}
