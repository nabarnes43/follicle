import { Header } from '@/components/shared/Header'
import { ProductGrid } from '@/components/products/ProductGrid'

export default function IngredientLoading() {
  return (
    <div>
      <Header
        title="Loading Products"
        subtitle="Personalized with follicle matching algorithm"
      />
      <ProductGrid products={[]} loading={true} />
    </div>
  )
}
