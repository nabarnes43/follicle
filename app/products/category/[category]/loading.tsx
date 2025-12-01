import { ProductGrid } from '@/components/products/ProductGrid'

export default function CategoryLoading() {
  return (
    <ProductGrid products={[]} title="Loading category..." loading={true} />
  )
}
