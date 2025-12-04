import { Header } from '@/components/navigation/Header'
import { ProductGrid } from '@/components/products/ProductGrid'

export default function CategoryLoading() {
  return (
    <div>
      <Header title="Loading Category" />
      <ProductGrid products={[]} loading={true} />
    </div>
  )
}
