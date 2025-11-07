'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { User } from '@/types/user'
import { Routine } from '@/types/routine'
import { Product } from '@/types/product'
import { RoutineCard } from '@/components/routines/RoutineCard'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { productsCache } from '@/lib/matching/productsCache'
import { Globe, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth'

function PublicRoutinesContent({ userData }: { userData: User }) {
  const router = useRouter()
  const { user } = useAuth()

  // Data
  const [allRoutines, setAllRoutines] = useState<Routine[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // UI
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRoutinesAndProducts()
  }, [])

  const fetchRoutinesAndProducts = async () => {
    try {
      // Fetch products from cache
      const products = await productsCache.getProducts()
      setAllProducts(products)

      const token = await user?.getIdToken()

      // Fetch all public routines
      const response = await fetch('/api/routines/public', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch public routines')
      }

      const data = await response.json()

      if (data.routines) {
        setAllRoutines(data.routines)
      }
    } catch (error) {
      console.error('Error fetching routines:', error)
      toast.error('Failed to load public routines')
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

  // Client-side search filter
  const filteredRoutines = allRoutines.filter((routine) =>
    routine.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-12 w-12" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Browse Routines</h1>
        <p className="text-muted-foreground">
          Discover hair care routines shared by the community
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder="Search routines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results Count */}
      {searchQuery && (
        <p className="text-muted-foreground mb-4 text-sm">
          Found {filteredRoutines.length} routine
          {filteredRoutines.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Routines Grid */}
      {filteredRoutines.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {searchQuery ? <Search /> : <Globe />}
            </EmptyMedia>
            <EmptyTitle>
              {searchQuery ? 'No routines found' : 'No public routines yet'}
            </EmptyTitle>
            <EmptyDescription>
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Be the first to share a public routine!'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filteredRoutines.map((routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              allProducts={allProducts}
              onView={() => handleView(routine.id)}
              onShare={() => handleShare(routine.id)}
              onDelete={undefined} // No delete button for public browse
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PublicRoutinesPage() {
  return (
    <RequireAuth requireFollicleId>
      {(userData) => <PublicRoutinesContent userData={userData} />}
    </RequireAuth>
  )
}
