import { Header } from '@/components/shared/Header'
import { RoutineGrid } from '@/components/routines/RoutineGrid'
import { Loader2 } from 'lucide-react'

export default function PrivateRoutinesLoading() {
  return (
    <div>
      <Header
        title="Loading Products"
        subtitle="Personalized with follicle matching algorithm"
      />
      <RoutineGrid routines={[]} loading={true} />
    </div>
  )
}
