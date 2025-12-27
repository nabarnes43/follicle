'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PreComputedRoutineMatchScore } from '@/types/routineMatching'
import { RoutineGrid } from '@/components/routines/RoutineGrid'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClipboardCheck, Bookmark, Heart, Copy, ArrowLeft } from 'lucide-react'
import { Button } from '../ui/button'

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
  const router = useRouter()

  // Determine title based on context
  const title = profileUserDisplayName
    ? `${profileUserDisplayName}'s Routines`
    : 'My Routines'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button - only show when viewing another user's profile */}
      {profileUserDisplayName && (
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      )}
      <h1 className="mb-8 text-3xl font-bold">{title}</h1>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="">
          <TabsTrigger value="created" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Created ({createdScores.length})
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Saved ({savedScores.length})
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Liked ({likedScores.length})
          </TabsTrigger>
          <TabsTrigger value="disliked" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Disliked ({dislikedScores.length})
          </TabsTrigger>
          <TabsTrigger value="adapted" className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Adapted ({adaptedScores.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="created">
          <RoutineGrid
            routines={createdScores}
            showMatchScore={false}
            hideSaveButton
          />
        </TabsContent>

        <TabsContent value="saved">
          <RoutineGrid
            routines={savedScores}
            showMatchScore={false}
            hideSaveButton
          />
        </TabsContent>

        <TabsContent value="liked">
          <RoutineGrid
            routines={likedScores}
            showMatchScore={false}
            hideSaveButton
          />
        </TabsContent>

        <TabsContent value="disliked">
          <RoutineGrid
            routines={dislikedScores}
            showMatchScore={false}
            hideSaveButton
          />
        </TabsContent>

        <TabsContent value="adapted">
          <RoutineGrid
            routines={adaptedScores}
            showMatchScore={false}
            hideSaveButton
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
