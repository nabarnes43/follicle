import { ProductGrid } from '@/components/products/ProductGrid'

export default function IngredientLoading() {
  return (
    <ProductGrid products={[]} title="Loading products..." loading={true} />
  )
}
