import { Header } from '@/components/navigation/Header'
import { RoutineGrid } from '@/components/routines/RoutineGrid'

export default function PublicRoutinesLoading() {
  return (
    <div>
      <Header
        title="Loading Routines"
        subtitle="Personalized with follicle matching algorithm"
      />
      <RoutineGrid routines={[]} loading={true}/>
    </div>
  )
}
