'use client'

import { use } from 'react'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { RoutineForm } from '@/components/routines/RoutineForm'

export default function AdaptRoutinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <RequireAuth requireFollicleId>
      {(userData) => (
        <RoutineForm mode="adapt" routineId={id} userData={userData} />
      )}
    </RequireAuth>
  )
}
