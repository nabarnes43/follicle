import { Header } from '@/components/shared/Header'
import { ProductGrid } from '@/components/products/ProductGrid'

export default function ProductsLoading() {
  return (
    <div>
      <Header title="Loading Saved Products" />
      <ProductGrid products={[]} loading={true} />
    </div>
  )
}