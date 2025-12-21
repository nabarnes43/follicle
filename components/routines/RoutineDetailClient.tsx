'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Routine } from '@/types/routine'
import { PreComputedRoutineMatchScore } from '@/types/routineMatching'
import {
  ArrowLeft,
  Share2,
  Trash2,
  Lock,
  Globe,
  Loader2,
  Heart,
  ThumbsDown,
  Bookmark,
  Copy,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRoutineInteraction } from '@/hooks/useRoutineInteraction'

interface RoutineDetailClientProps {
  routine: Routine
  productsMap: Record<
    string,
    {
      id: string
      name: string
      brand: string
      image_url: string | null
      price: number | null
      category: string
    }
  >

  authorName: string
  adaptedFromAuthor: string | null
  matchScore: PreComputedRoutineMatchScore | null
  currentUserId?: string
}

export function RoutineDetailClient({
  routine,
  productsMap,
  authorName,
  adaptedFromAuthor,
  matchScore: initialMatchScore,
  currentUserId,
}: RoutineDetailClientProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [matchScore, setMatchScore] = useState(initialMatchScore)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const {
    interactions,
    toggleLike,
    toggleDislike,
    toggleSave,
    trackView,
    isLoading: interactionLoading,
    isReady,
  } = useRoutineInteraction(routine.id)

  const hasTrackedView = useRef(false)

  // Reset tracking when product changes
  useEffect(() => {
    hasTrackedView.current = false
  }, [routine.id])

  // Track view once when user is ready
  useEffect(() => {
    if (isReady && !hasTrackedView.current) {
      hasTrackedView.current = true
      console.log('Tracking view for routine:', routine.id, 'isReady:', isReady)
      trackView()
    }
  }, [isReady, trackView, routine.id])

  // Fetch fresh score after interactions
  const refetchScore = async () => {
    if (!user) return

    setIsRefreshing(true)

    try {
      const token = await user.getIdToken()
      const response = await fetch(`/api/routines/${routine.id}/score`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.score) {
          setMatchScore(data.score)
          console.log('✅ Fetched fresh routine score:', data.score.totalScore)
        }
      }
    } catch (error) {
      console.error('Failed to fetch fresh routine score:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Updated interaction handlers
  const handleLike = async () => {
    await toggleLike()
    await refetchScore()
  }

  const handleDislike = async () => {
    await toggleDislike()
    await refetchScore()
  }

  const handleSave = async () => {
    await toggleSave()
    await refetchScore()
  }

  const handleShare = () => {
    const link = `${window.location.origin}/routines/${routine.id}`
    navigator.clipboard.writeText(link)
    toast.success('Link copied to clipboard!')
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const token = await user?.getIdToken()

      const response = await fetch(`/api/routines/${routine.id}/delete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete routine')
      toast.success('Routine deleted')
      router.push('/routines/private')
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Failed to delete routine')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const getFrequencyText = (frequency: any): string => {
    if (frequency.unit === 'day') {
      return frequency.interval === 1
        ? 'Used every day'
        : `Used every ${frequency.interval} days`
    }
    if (frequency.unit === 'week') {
      return frequency.interval === 1
        ? 'Used every week'
        : `Used every ${frequency.interval} weeks`
    }
    return frequency.interval === 1
      ? 'Used every month'
      : `Used every ${frequency.interval} months`
  }

  const isOwner = currentUserId === routine.user_id

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          {/* Refreshing Indicator */}
          {isRefreshing && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
              <p className="text-sm text-blue-700">Updating score...</p>
            </div>
          )}

          {/* Title Row with Back Button */}
          <div className="mb-4 flex items-center gap-3">
            <Button onClick={() => router.back()} variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">
              {routine.name}
            </h1>
            {routine.is_public ? (
              <Globe className="h-5 w-5 text-gray-400" />
            ) : (
              <Lock className="h-5 w-5 text-gray-400" />
            )}

            {/* Match Score Badge - Inline with title */}
            {matchScore && matchScore.totalScore !== undefined && (
              <div className="bg-primary/10 flex items-center gap-1.5 rounded-full px-3 py-1">
                <span className="text-primary text-sm font-semibold">
                  {Math.round(matchScore.totalScore * 100)}%
                </span>
                <span className="text-muted-foreground text-xs">Match</span>
              </div>
            )}
          </div>
          {/* Match Reasons as Chips - Only if exists */}
          {matchScore &&
            matchScore.totalScore !== undefined &&
            matchScore.matchReasons &&
            matchScore.matchReasons.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {matchScore.matchReasons.slice(0, 5).map((reason, idx) => (
                  <div
                    key={idx}
                    className="bg-muted text-muted-foreground rounded-md px-3 py-1.5 text-xs"
                  >
                    {reason}
                  </div>
                ))}
              </div>
            )}
          {/* Interaction Buttons Row - Only show if user has completed analysis */}
          {matchScore && (
            <div className="mb-4 flex items-center justify-between gap-4">
              {/* Left: Like, Dislike, Save, Adapt/Edit */}
              <div className="flex gap-2">
                <Button
                  onClick={handleLike}
                  disabled={interactionLoading || isRefreshing || !isReady}
                  variant={interactions.like ? 'default' : 'outline'}
                  size="sm"
                >
                  <Heart
                    className={`mr-2 h-4 w-4 ${interactions.like ? 'fill-current' : ''}`}
                  />
                  {interactions.like ? 'Liked' : 'Like'}
                </Button>

                <Button
                  onClick={handleDislike}
                  disabled={interactionLoading || isRefreshing || !isReady}
                  variant={interactions.dislike ? 'destructive' : 'outline'}
                  size="sm"
                >
                  <ThumbsDown
                    className={`mr-2 h-4 w-4 ${interactions.dislike ? 'fill-current' : ''}`}
                  />
                  {interactions.dislike ? 'Disliked' : 'Dislike'}
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={interactionLoading || isRefreshing || !isReady}
                  variant={interactions.save ? 'default' : 'outline'}
                  size="sm"
                >
                  <Bookmark
                    className={`mr-2 h-4 w-4 ${interactions.save ? 'fill-current' : ''}`}
                  />
                  {interactions.save ? 'Saved' : 'Save'}
                </Button>

                {/* Show Adapt button if NOT owner */}
                {!isOwner && routine.id && (
                  <Button
                    onClick={() => router.push(`/routines/${routine.id}/adapt`)}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Adapt
                  </Button>
                )}

                {/* Show Edit button if owner */}
                {isOwner && (
                  <Button
                    onClick={() => router.push(`/routines/${routine.id}/edit`)}
                    variant="outline"
                    size="sm"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>

              {/* Right: Share & Delete (only if owner) */}
              {isOwner && (
                <div className="flex gap-2">
                  {routine.is_public && (
                    <Button onClick={handleShare} variant="outline" size="sm">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  )}
                  <Button
                    onClick={() => setDeleteDialogOpen(true)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <p className="text-sm text-gray-600">
            {routine.steps.length} step{routine.steps.length !== 1 ? 's' : ''} •
            By {authorName}
            {adaptedFromAuthor && (
              <span> • Adapted from {adaptedFromAuthor}</span>
            )}
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {routine.steps.map((step, stepIndex) => {
            // Skip steps without a product
            if (!step.product_id) return null

            const product = productsMap[step.product_id]
            if (!product) return null

            return (
              <Card
                key={`${stepIndex}-${product.id}`}
                className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
                onClick={() => router.push(`/products/${product.id}`)}
              >
                <CardContent className="p-4">
                  {/* Product Image */}
                  <div className="mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-white">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100">
                        <span className="text-sm text-gray-400">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Step Badge */}
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className="rounded px-2 py-1 text-xs font-medium"
                      style={{ color: '#000' }}
                    >
                      {step.step_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      Step {stepIndex + 1}
                    </span>
                  </div>

                  {/* Brand */}
                  <p className="mb-1 text-xs text-gray-600">{product.brand}</p>

                  {/* Product Name */}
                  <h4 className="mb-3 line-clamp-2 text-sm font-semibold">
                    {product.name}
                  </h4>

                  {/* Frequency */}
                  <p className="mb-3 text-xs text-gray-600">
                    {getFrequencyText(step.frequency)}
                  </p>

                  {/* Technique & Notes Section - Always show with border */}
                  <div className="border-t pt-3">
                    {step.amount && (
                      <div>
                        <p className="mb-1 text-xs font-semibold text-gray-700">
                          Amount:
                        </p>
                        <p className="text-xs leading-relaxed text-gray-600">
                          {step.amount}
                        </p>
                      </div>
                    )}
                    {step.technique && (
                      <div className="mb-2">
                        <p className="mb-1 text-xs font-semibold text-gray-700">
                          Technique:
                        </p>
                        <p className="text-xs leading-relaxed text-gray-600">
                          {step.technique}
                        </p>
                      </div>
                    )}
                    {step.notes && (
                      <div className="mb-2">
                        <p className="mb-1 text-xs font-semibold text-gray-700">
                          Notes:
                        </p>
                        <p className="text-xs leading-relaxed text-gray-600">
                          {step.notes}
                        </p>
                      </div>
                    )}
                    {!step.technique && !step.notes && !step.amount && (
                      <p className="text-xs text-gray-400">
                        No additional details
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Routine</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{routine.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
