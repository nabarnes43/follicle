'use client'

import { use } from 'react'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { RoutineForm } from '@/components/routines/RoutineForm'

export default function EditRoutinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <RequireAuth requireFollicleId>
      {(userData) => (
        <RoutineForm mode="edit" routineId={id} userData={userData} />
      )}
    </RequireAuth>
  )
}
