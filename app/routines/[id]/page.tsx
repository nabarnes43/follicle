'use client'

import { useState, useEffect } from 'react'
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

        const products = await productsCache.getProducts()
        setAllProducts(products)
      } catch (err) {
        console.error('Error fetching routine:', err)
        setError('Failed to load routine')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, user, router])

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
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">
                {routine.name}
              </h1>
              {routine.is_public ? (
                <Globe className="h-5 w-5 text-gray-400" />
              ) : (
                <Lock className="h-5 w-5 text-gray-400" />
              )}
            </div>

            {isOwner && (
              <div className="flex gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
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

          <p className="text-sm text-gray-600">
            {routine.steps.length} step{routine.steps.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {routine.steps.map((step, stepIndex) =>
            step.products.map((stepProduct) => {
              const product = allProducts.find(
                (p) => p.id === stepProduct.product_id
              )
              if (!product) return null

              return (
                <Card
                  key={`${stepIndex}-${product.id}`}
                  className="cursor-pointer overflow-hidden border-t-4 transition-shadow hover:shadow-lg"
                  onClick={() => setSelectedProduct(createMatchScore(product))}
                  style={{
                    borderTopColor: step.step_name
                      .toLowerCase()
                      .includes('essence')
                      ? '#d4edda'
                      : step.step_name.toLowerCase().includes('toner')
                        ? '#cce5ff'
                        : step.step_name.toLowerCase().includes('serum')
                          ? '#d4edda'
                          : step.step_name.toLowerCase().includes('moisturizer')
                            ? '#e2d5f0'
                            : '#e8e8e8',
                  }}
                >
                  <CardContent className="p-4">
                    {/* Product Image */}
                    <div className="mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-white">
                      {' '}
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100">
                          <span className="text-sm text-gray-400">
                            No image
                          </span>
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
                    <p className="mb-1 text-xs text-gray-600">
                      {product.brand}
                    </p>

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
                      {stepProduct.amount && (
                        <div>
                          <p className="mb-1 text-xs font-semibold text-gray-700">
                            Amount:
                          </p>
                          <p className="text-xs leading-relaxed text-gray-600">
                            {stepProduct.amount}
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
                      {!step.technique &&
                        !step.notes &&
                        !stepProduct.amount && (
                          <p className="text-xs text-gray-400">
                            No additional details
                          </p>
                        )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
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
