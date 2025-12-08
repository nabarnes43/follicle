import { RoutineForm } from '@/components/routines/RoutineForm'

export default function Loading() {
  return (
    <RoutineForm
      mode="create"
      userData={{
        userId: '',
        email: null,
        photoUrl: null,
        follicleId: '',
        analysisComplete: null,
        createdAt: null,
        isAnonymous: false,
        providerData: [],
        lastLoginAt: null,
      }}
      productScores={[]}
      loading={true}
    />
  )
}
