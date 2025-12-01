import { ProductGrid } from '@/components/products/ProductGrid'

export default function ProductsLoading() {
  return (
    <ProductGrid
      products={[]}
      title="Loading All Product Recommendations"
      subtitle="Personalized with follicle matching algorithm"
      loading={true}
    />
  )
}
