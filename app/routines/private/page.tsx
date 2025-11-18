'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { User } from '@/types/user'
import { Routine } from '@/types/routine'
import { Product } from '@/types/product'
import { RoutineCard } from '@/components/routines/RoutineCard'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Input } from '@/components/ui/input'
import { productsCache } from '@/lib/matching/products/productsCache'
import {
  ClipboardCheck,
  Trash2,
  Bookmark,
  Heart,
  Copy,
  Search,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth'

function MyRoutinesContent({ userData }: { userData: User }) {
  const router = useRouter()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'created'

  // Data
  const [allRoutines, setAllRoutines] = useState({
    created: [] as Routine[],
    saved: [] as Routine[],
    liked: [] as Routine[],
    adapted: [] as Routine[],
  })
  const [allProducts, setAllProducts] = useState<Product[]>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchRoutinesAndProducts()
  }, [userData])

  const fetchRoutinesAndProducts = async () => {
    try {
      // Fetch products from cache
      const products = await productsCache.getProducts()
      setAllProducts(products)

      const token = await user?.getIdToken()

      // Fetch user's created routines
      const createdResponse = await fetch('/api/routines/private', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const createdData = await createdResponse.json()

      // Fetch public routines to get saved/liked/adapted ones
      const publicResponse = await fetch('/api/routines/public', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const publicData = await publicResponse.json()

      const allPublicRoutines = publicData.routines || []

      // Filter by interaction type
      const savedRoutines = allPublicRoutines.filter((r: Routine) =>
        (userData.savedRoutines || []).includes(r.id)
      )
      const likedRoutines = allPublicRoutines.filter((r: Routine) =>
        (userData.likedRoutines || []).includes(r.id)
      )
      const adaptedRoutines = createdData.routines.filter(
        (r: Routine) => r.adaptedFrom !== undefined
      )

      setAllRoutines({
        created: createdData.routines || [],
        saved: savedRoutines,
        liked: likedRoutines,
        adapted: adaptedRoutines,
      })
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

  // Filter routines by search query
  const filterRoutines = (routines: Routine[]) => {
    if (!searchQuery.trim()) return routines

    const query = searchQuery.toLowerCase()
    return routines.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query)
    )
  }

  // Render tab content
  const renderTabContent = (
    type: 'created' | 'saved' | 'liked' | 'adapted',
    icon: any,
    emptyMessage: string
  ) => {
    const routines = filterRoutines(allRoutines[type])
    const Icon = icon

    if (routines.length === 0) {
      const message = searchQuery.trim()
        ? `No routines found matching "${searchQuery}"`
        : emptyMessage

      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon />
            </EmptyMedia>
            <EmptyTitle>No routines yet</EmptyTitle>
            <EmptyDescription>{message}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {routines.map((routine) => (
          <RoutineCard
            key={routine.id}
            routine={routine}
            allProducts={allProducts}
            onView={() => handleView(routine.id)}
            showMatchScore={false}
            hideSaveButton={true} // hide save button on My Routines
          />
        ))}
      </div>
    )
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

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search routines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
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
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="created" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Created ({allRoutines.created.length})
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Saved ({allRoutines.saved.length})
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Liked ({allRoutines.liked.length})
          </TabsTrigger>
          <TabsTrigger value="adapted" className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Adapted ({allRoutines.adapted.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="created">
          {renderTabContent(
            'created',
            ClipboardCheck,
            'Create your first routine to get started!'
          )}
        </TabsContent>

        <TabsContent value="saved">
          {renderTabContent(
            'saved',
            Bookmark,
            'Save routines from the community to try later!'
          )}
        </TabsContent>

        <TabsContent value="liked">
          {renderTabContent('liked', Heart, 'Like routines that work for you!')}
        </TabsContent>

        <TabsContent value="adapted">
          {renderTabContent(
            'adapted',
            Copy,
            'Adapt routines from others to make them your own!'
          )}
        </TabsContent>
      </Tabs>
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
