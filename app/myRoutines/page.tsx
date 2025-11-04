'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { User } from '@/types/user'
import { Routine } from '@/types/routine'
import { Product } from '@/types/product'
import { RoutineCard } from '@/components/routines/RoutineCard'
import { Spinner } from '@/components/ui/spinner'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { productsCache } from '@/lib/matching/productsCache'
import { ClipboardCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

function MyRoutinesContent({ userData }: { userData: User }) {
  const router = useRouter()

  // Data
  const [routines, setRoutines] = useState<Routine[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])

  // UI
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchRoutinesAndProducts()
  }, [userData])

  const fetchRoutinesAndProducts = async () => {
    try {
      // Fetch products from cache
      const products = await productsCache.getProducts()
      setAllProducts(products)

      // Fetch user's routines
      const response = await fetch(`/api/routines?userId=${userData.userId}`)
      const data = await response.json()

      if (data.routines) {
        setRoutines(data.routines)
      }
    } catch (error) {
      console.error('Error fetching routines:', error)
      toast.error('Failed to load routines')
    } finally {
      setLoading(false)
    }
  }

  const handleView = (routineId: string) => {
    router.push(`/routines/${routineId}`)
  }

  const handleShare = (routineId: string) => {
    const link = `${window.location.origin}/routines/${routineId}`
    navigator.clipboard.writeText(link)
    toast.success('Link copied to clipboard!')
  }

  const handleDeleteClick = (routine: Routine) => {
    setRoutineToDelete(routine)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!routineToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/routines/${routineToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Routine deleted')
        setRoutines((prev) => prev.filter((r) => r.id !== routineToDelete.id))
      } else {
        toast.error('Failed to delete routine')
      }
    } catch (error) {
      console.error('Error deleting routine:', error)
      toast.error('Failed to delete routine')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setRoutineToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setRoutineToDelete(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-12 w-12" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">My Routines</h1>

      {routines.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardCheck />
            </EmptyMedia>
            <EmptyTitle>No routines yet</EmptyTitle>
            <EmptyDescription>
              Create your first routine to keep track of your hair care steps!
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              allProducts={allProducts}
              onView={() => handleView(routine.id)}
              onShare={() => handleShare(routine.id)}
              onDelete={() => handleDeleteClick(routine)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Routine?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{routineToDelete?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function MyRoutinesPage() {
  return (
    <RequireAuth requireFollicleId>
      {(userData) => <MyRoutinesContent userData={userData} />}
    </RequireAuth>
  )
}
