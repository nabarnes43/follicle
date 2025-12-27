import { IngredientsGrid } from '@/components/ingredients/IngredientsGrid'
import { Header } from '@/components/navigation/Header'

export default function IngredientsLoading() {
  return (
    <div>
      <Header
        title="Loading Ingredient Database"
        subtitle="Loading ingredients..."
      />
      <IngredientsGrid ingredients={[]} loading={true} />
    </div>
  )
}
