import { ProductGrid } from '@/components/products/ProductGrid'

export default function ProductsLoading() {
  return (
    <ProductGrid products={[]} title="Loading Saved Products" loading={true} />
  )
}
