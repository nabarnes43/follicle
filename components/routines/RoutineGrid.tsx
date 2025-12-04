'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PreComputedRoutineMatchScore } from '@/types/routineMatching'
import { RoutineCard } from '@/components/routines/RoutineCard'
import { RoutineCardSkeleton } from '@/components/routines/RoutineCardSkeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Globe, Search, X } from 'lucide-react'

interface RoutineGridProps {
  routines: PreComputedRoutineMatchScore[]
  showMatchScore?: boolean
  loading?: boolean
}

export function RoutineGrid({
  routines,
  showMatchScore = true,
  loading = false,
}: RoutineGridProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRoutines = useMemo(() => {
    if (!searchQuery.trim()) return routines

    const query = searchQuery.toLowerCase()
    return routines.filter((score) =>
      score.routine.name.toLowerCase().includes(query)
    )
  }, [routines, searchQuery])

  const handleView = (routineId: string) => {
    router.push(`/routines/${routineId}`)
  }

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Search Bar */}
      <div className="relative mb-3 max-w-md">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder="Search routines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results Count */}
      {searchQuery && (
        <p className="text-muted-foreground mb-4 text-sm">
          Found {filteredRoutines.length} routine
          {filteredRoutines.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <RoutineCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRoutines.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {searchQuery ? <Search /> : <Globe />}
            </EmptyMedia>
            <EmptyTitle>
              {searchQuery ? 'No routines found' : 'No routines yet'}
            </EmptyTitle>
            <EmptyDescription>
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Be the first to share a public routine!'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {/* Routines Grid */}
      {!loading && filteredRoutines.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filteredRoutines.map((score) => (
            <RoutineCard
              key={score.routine.id}
              routineScore={score}
              showMatchScore={showMatchScore}
              onView={() => handleView(score.routine.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
