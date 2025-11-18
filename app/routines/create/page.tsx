'use client'

import { RequireAuth } from '@/components/auth/RequireAuth'
import { RoutineForm } from '@/components/routines/RoutineForm'

export default function CreateRoutinePage() {
  return (
    <RequireAuth requireFollicleId>
      {(userData) => <RoutineForm mode="create" userData={userData} />}
    </RequireAuth>
  )
}
