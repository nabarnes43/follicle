'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ProductDetailDialog } from '@/components/products/ProductDetailDialog'
import { Routine } from '@/types/routine'
import { Product } from '@/types/product'
import { ProductMatchScore } from '@/types/productMatching'
import { productsCache } from '@/lib/matching/products/productsCache'
import { ArrowLeft, Share2, Trash2, Lock, Globe, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { use } from 'react'
import { Heart, ThumbsDown, Bookmark, Copy, Pencil } from 'lucide-react'
import { useRoutineInteraction } from '@/hooks/useRoutineInteraction'
import { matchRoutinesForUser } from '@/lib/matching/routines/routineMatcher'
import { RoutineMatchScore } from '@/types/routineMatching'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

export default function RoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] =
    useState<ProductMatchScore | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [matchScore, setMatchScore] = useState<RoutineMatchScore | null>(null)
  const [authorName, setAuthorName] = useState<string>('Anonymous')
  const [adaptedFromAuthor, setAdaptedFromAuthor] = useState<string | null>(
    null
  )
  const {
    interactions,
    toggleLike,
    toggleDislike,
    toggleSave,
    trackView,
    isLoading: interactionLoading,
  } = useRoutineInteraction(id)

  const hasTrackedView = useRef(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = user ? await user.getIdToken() : null

        const routineRes = await fetch(`/api/routines/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (routineRes.status === 403) {
          toast.error('This routine is private')
          router.push('/routines/private')
          return
        }

        if (routineRes.status === 404) {
          setError('Routine not found')
          setLoading(false)
          return
        }

        if (!routineRes.ok) {
          setError('Failed to load routine')
          setLoading(false)
          return
        }

        const { routine: routineData } = await routineRes.json()
        setRoutine(routineData)

        // Fetch author name
        if (routineData.user_id) {
          try {
            const userDoc = await getDoc(doc(db, 'users', routineData.user_id))
            if (userDoc.exists()) {
              setAuthorName(userDoc.data().displayName || 'Anonymous')
            }
          } catch (error) {
            console.error('Failed to fetch author:', error)
          }
        }

        // Fetch adapted-from author if this is an adapted routine
        if (routineData.adaptedFrom) {
          try {
            const sourceDoc = await getDoc(
              doc(db, 'routines', routineData.adaptedFrom)
            )
            if (sourceDoc.exists()) {
              const sourceRoutine = sourceDoc.data()
              if (sourceRoutine.user_id) {
                const sourceUserDoc = await getDoc(
                  doc(db, 'users', sourceRoutine.user_id)
                )
                if (sourceUserDoc.exists()) {
                  setAdaptedFromAuthor(
                    sourceUserDoc.data().displayName || 'Anonymous'
                  )
                }
              }
            }
          } catch (error) {
            console.error('Failed to fetch adapted-from author:', error)
          }
        }

        const products = await productsCache.getProducts()
        setAllProducts(products)

        // Run matching if user has completed hair analysis
        if (user) {
          try {
            // Fetch user's Firestore document to get hairAnalysis
            const userDocRef = doc(db, 'users', user.uid)
            const userDoc = await getDoc(userDocRef)

            if (userDoc.exists()) {
              const userData = userDoc.data()

              // Only run matching if user has hairAnalysis and follicleId
              if (userData.hairAnalysis && userData.follicleId) {
                const scored = await matchRoutinesForUser(
                  { hairAnalysis: userData.hairAnalysis },
                  [routineData], // Score just this one routine
                  userData.follicleId,
                  products
                )

                if (scored.length > 0) {
                  setMatchScore(scored[0])
                }
              }
            }
          } catch (matchError) {
            console.error('Failed to calculate match score:', matchError)
            // Don't block page load if matching fails
          }
        }
      } catch (err) {
        console.error('Error fetching routine:', err)
        setError('Failed to load routine')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, user, router])

  useEffect(() => {
    if (routine && !hasTrackedView.current) {
      hasTrackedView.current = true
      trackView()
    }
  }, [routine?.id, trackView])

  const createMatchScore = (product: Product): ProductMatchScore => ({
    product,
    totalScore: 0,
    matchReasons: [],
    breakdown: { ingredientScore: 0, engagementScore: 0 },
  })

  const handleShare = () => {
    const link = `${window.location.origin}/routines/${id}`
    navigator.clipboard.writeText(link)
    toast.success('Link copied to clipboard!')
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const token = await user?.getIdToken()

      const response = await fetch(`/api/routines/${id}`, {
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

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !routine) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Routine Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'This routine does not exist or has been deleted.'}
          </p>
          <Button onClick={() => router.push('/routines/private')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Routines
          </Button>
        </div>
      </div>
    )
  }

  const isOwner = user?.uid === routine.user_id

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
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
            {matchScore && (
              <div className="bg-primary/10 flex items-center gap-1.5 rounded-full px-3 py-1">
                <span className="text-primary text-sm font-semibold">
                  {Math.round(matchScore.totalScore * 100)}%
                </span>
                <span className="text-muted-foreground text-xs">Match</span>
              </div>
            )}
          </div>

          {/* Match Reasons as Chips - Only if exists */}
          {matchScore && matchScore.matchReasons.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {matchScore.matchReasons.slice(0, 3).map((reason, idx) => (
                <div
                  key={idx}
                  className="bg-muted text-muted-foreground rounded-md px-3 py-1.5 text-xs"
                >
                  {reason}
                </div>
              ))}
            </div>
          )}

          {/* Interaction Buttons Row */}
          <div className="mb-4 flex items-center justify-between gap-4">
            {/* Left: Like, Dislike, Save, Adapt/Edit */}
            <div className="flex gap-2">
              <Button
                onClick={toggleLike}
                disabled={interactionLoading}
                variant={interactions.like ? 'default' : 'outline'}
                size="sm"
              >
                <Heart
                  className={`mr-2 h-4 w-4 ${interactions.like ? 'fill-current' : ''}`}
                />
                {interactions.like ? 'Liked' : 'Like'}
              </Button>

              <Button
                onClick={toggleDislike}
                disabled={interactionLoading}
                variant={interactions.dislike ? 'destructive' : 'outline'}
                size="sm"
              >
                <ThumbsDown
                  className={`mr-2 h-4 w-4 ${interactions.dislike ? 'fill-current' : ''}`}
                />
                {interactions.dislike ? 'Disliked' : 'Dislike'}
              </Button>

              <Button
                onClick={toggleSave}
                disabled={interactionLoading}
                variant={interactions.save ? 'default' : 'outline'}
                size="sm"
              >
                <Bookmark
                  className={`mr-2 h-4 w-4 ${interactions.save ? 'fill-current' : ''}`}
                />
                {interactions.save ? 'Saved' : 'Save'}
              </Button>

              {/* NEW: Show Adapt button if NOT owner */}
              {!isOwner && (
                <Button
                  onClick={() => router.push(`/routines/${id}/adapt`)}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Adapt
                </Button>
              )}

              {/* NEW: Show Edit button if owner */}
              {isOwner && (
                <Button
                  onClick={() => router.push(`/routines/${id}/edit`)}
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

          {/* Metadata */}
          <p className="text-sm text-gray-600">
            {routine.steps.length} step{routine.steps.length !== 1 ? 's' : ''} {' '}
            • By {authorName}
            {adaptedFromAuthor && (
              <span> • Originally by {adaptedFromAuthor}</span>
            )}
          </p>
        </div>
        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {routine.steps.map((step, stepIndex) => {
            // Skip steps without a product
            if (!step.product_id) return null

            const product = allProducts.find((p) => p.id === step.product_id)
            if (!product) return null

            return (
              <Card
                key={`${stepIndex}-${product.id}`}
                className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
                onClick={() => setSelectedProduct(createMatchScore(product))}
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

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        match={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        showMatchScore={false}
      />

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
