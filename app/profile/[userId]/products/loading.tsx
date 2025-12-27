import { ProductGrid } from '@/components/products/ProductGrid'

export default function Loading() {
  return <ProductGrid products={[]} loading={true} />
}
