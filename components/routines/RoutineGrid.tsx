'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PreComputedRoutineMatchScore } from '@/types/routineMatching'
import { RoutineCard } from '@/components/routines/RoutineCard'
import { RoutineCardSkeleton } from '@/components/routines/RoutineCardSkeleton'
import { BaseGrid } from '@/components/shared/BaseGrid'
import { Globe } from 'lucide-react'

interface RoutineGridProps {
  routines: PreComputedRoutineMatchScore[]
  showMatchScore?: boolean
  loading?: boolean
  hideSaveButton?: boolean
}

export function RoutineGrid({
  routines,
  showMatchScore = true,
  loading = false,
  hideSaveButton = false,
}: RoutineGridProps) {
  const router = useRouter()

  const handleView = (routineId: string) => {
    router.push(`/routines/${routineId}`)
  }

  return (
    <BaseGrid
      items={routines}
      loading={loading}
      gridClassName="grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3"
      searchPlaceholder="Search routines..."
      getSearchableText={(score) => score.routine.name}
      emptyIcon={<Globe />}
      emptyTitle="No routines found"
      emptyDescription="Try adjusting your search terms"
      renderCard={(score) => (
        <RoutineCard
          routineScore={score}
          showMatchScore={showMatchScore}
          onView={() => handleView(score.routine.id)}
          hideSaveButton={hideSaveButton}
        />
      )}
      renderSkeleton={() => <RoutineCardSkeleton />}
    />
  )
}
