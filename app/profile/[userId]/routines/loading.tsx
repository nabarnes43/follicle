import { RoutineGrid } from '@/components/routines/RoutineGrid'

export default function Loading() {
  return <RoutineGrid routines={[]} loading={true} showMatchScore={false} />
}
