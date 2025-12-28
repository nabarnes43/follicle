'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { PreComputedRoutineMatchScore } from '@/types/routineMatching'
import { RoutineGrid } from '@/components/routines/RoutineGrid'
import { SavedPageLayout } from '@/components/shared/SavedPageLayout'
import { ClipboardCheck, Bookmark, Heart, ThumbsDown, Copy } from 'lucide-react'

interface PrivateRoutinesClientProps {
  createdScores: PreComputedRoutineMatchScore[]
  savedScores: PreComputedRoutineMatchScore[]
  likedScores: PreComputedRoutineMatchScore[]
  dislikedScores: PreComputedRoutineMatchScore[]
  adaptedScores: PreComputedRoutineMatchScore[]
  profileUserDisplayName?: string
}

export function PrivateRoutinesClient({
  createdScores,
  savedScores,
  likedScores,
  dislikedScores,
  adaptedScores,
  profileUserDisplayName,
}: PrivateRoutinesClientProps) {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'created'

  // Determine title based on context
  const title = profileUserDisplayName
    ? `${profileUserDisplayName}'s Routines`
    : 'Saved Routines'

  const subtitle = profileUserDisplayName
    ? 'Created and saved hair routines'
    : 'Your created and saved routines'

  return (
    <SavedPageLayout
      title={title}
      subtitle={subtitle}
      defaultTab={defaultTab}
      showBackButton={!!profileUserDisplayName}
      tabs={[
        {
          value: 'created',
          label: 'Created',
          icon: <ClipboardCheck className="h-4 w-4" />,
          count: createdScores.length,
          content: (
            <RoutineGrid
              routines={createdScores}
              showMatchScore={false}
              hideSaveButton
            />
          ),
        },
        {
          value: 'saved',
          label: 'Saved',
          icon: <Bookmark className="h-4 w-4" />,
          count: savedScores.length,
          content: (
            <RoutineGrid
              routines={savedScores}
              showMatchScore={false}
              hideSaveButton
            />
          ),
        },
        {
          value: 'liked',
          label: 'Liked',
          icon: <Heart className="h-4 w-4" />,
          count: likedScores.length,
          content: (
            <RoutineGrid
              routines={likedScores}
              showMatchScore={false}
              hideSaveButton
            />
          ),
        },
        {
          value: 'disliked',
          label: 'Disliked',
          icon: <ThumbsDown className="h-4 w-4" />,
          count: dislikedScores.length,
          content: (
            <RoutineGrid
              routines={dislikedScores}
              showMatchScore={false}
              hideSaveButton
            />
          ),
        },
        {
          value: 'adapted',
          label: 'Adapted',
          icon: <Copy className="h-4 w-4" />,
          count: adaptedScores.length,
          content: (
            <RoutineGrid
              routines={adaptedScores}
              showMatchScore={false}
              hideSaveButton
            />
          ),
        },
      ]}
    />
  )
}
