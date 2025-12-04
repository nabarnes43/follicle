import { Header } from '@/components/navigation/Header'
import { ProductGrid } from '@/components/products/ProductGrid'

export default function ProductsLoading() {
  return (
    <div>
      <Header
        title="Loading Saved Products"
      />
      <ProductGrid products={[]} loading={true}/>
    </div>
  )
}