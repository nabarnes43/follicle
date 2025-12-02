'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useProductInteraction } from '@/hooks/useProductInteraction'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Heart, ThumbsDown, Bookmark, Loader2 } from 'lucide-react'
import { Product } from '@/types/product'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useAuth } from '@/contexts/auth'
import { use } from 'react'

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()

  const [product, setProduct] = useState<Product | null>(null)
  const [userScore, setUserScore] = useState<{
    score: number
    matchReasons: string[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    interactions,
    toggleLike,
    toggleDislike,
    toggleSave,
    trackView,
    isLoading,
  } = useProductInteraction(id)

  const hasTrackedView = useRef(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Firebase projectId:', db.app.options.projectId)
        console.log('Fetching product ID:', id)
        console.log('Fetching product with ID:', id)

        // Fetch product
        const productDoc = await getDoc(doc(db, 'products', id))

        console.log('Product doc exists:', productDoc.exists())
        console.log('Product data:', productDoc.data())

        if (!productDoc.exists()) {
          setError('Product not found')
          setLoading(false)
          return
        }
        setProduct({ id: productDoc.id, ...productDoc.data() } as Product)

        // Fetch user's pre-computed score if logged in
        if (user) {
          const scoreDoc = await getDoc(
            doc(db, 'users', user.uid, 'product_scores', id)
          )

          if (scoreDoc.exists()) {
            const data = scoreDoc.data()
            setUserScore({
              score: data.score || 0,
              matchReasons: data.matchReasons || [],
            })
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, user])

  useEffect(() => {
    if (product && !hasTrackedView.current) {
      hasTrackedView.current = true
      trackView()
    }
  }, [product, trackView])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'This product does not exist.'}
          </p>
          <Button onClick={() => router.push('/products')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </div>
      </div>
    )
  }

  const scorePercent = userScore ? Math.round(userScore.score * 100) : null

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Back Button */}
      <Button
        onClick={() => router.back()}
        variant="ghost"
        size="sm"
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Header */}
      <div className="mb-6">
        <p className="text-muted-foreground mb-1">{product.brand}</p>
        <h1 className="mb-2 text-3xl font-bold">{product.name}</h1>
        <div className="flex items-center gap-3">
          {scorePercent !== null && (
            <Badge className="px-3 py-1 text-lg">{scorePercent}% Match</Badge>
          )}
          <span className="text-xl font-bold">
            {product.price
              ? `$${product.price.toFixed(2)}`
              : 'Price not available'}
          </span>
        </div>
      </div>

      {/* Match Reasons */}
      {userScore && userScore.matchReasons.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {userScore.matchReasons.map((reason, idx) => (
            <div
              key={idx}
              className="bg-muted text-muted-foreground rounded-md px-3 py-1.5 text-sm"
            >
              {reason}
            </div>
          ))}
        </div>
      )}

      {/* Product Image */}
      <div className="mb-6 flex aspect-square max-w-md items-center justify-center overflow-hidden rounded-lg bg-white">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-contain p-8"
          />
        ) : (
          <span className="text-muted-foreground">No image available</span>
        )}
      </div>

      {/* Interaction Buttons */}
      <div className="mb-8 flex gap-2">
        <Button
          onClick={toggleLike}
          disabled={isLoading}
          variant={interactions.like ? 'default' : 'outline'}
        >
          <Heart
            className={`mr-2 h-4 w-4 ${interactions.like ? 'fill-current' : ''}`}
          />
          {interactions.like ? 'Liked' : 'Like'}
        </Button>

        <Button
          onClick={toggleDislike}
          disabled={isLoading}
          variant={interactions.dislike ? 'destructive' : 'outline'}
        >
          <ThumbsDown
            className={`mr-2 h-4 w-4 ${interactions.dislike ? 'fill-current' : ''}`}
          />
          {interactions.dislike ? 'Disliked' : 'Dislike'}
        </Button>

        <Button
          onClick={toggleSave}
          disabled={isLoading}
          variant={interactions.save ? 'default' : 'outline'}
        >
          <Bookmark
            className={`mr-2 h-4 w-4 ${interactions.save ? 'fill-current' : ''}`}
          />
          {interactions.save ? 'Saved' : 'Save'}
        </Button>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">Description</h2>
          <p className="text-muted-foreground">{product.description}</p>
        </div>
      )}

      {/* Ingredients */}
      <div>
        <h2 className="mb-2 text-lg font-semibold">Ingredients</h2>
        <div className="bg-muted max-h-48 overflow-y-auto rounded-lg p-4">
          {product.ingredients_normalized &&
          product.ingredients_normalized.length > 0 ? (
            <p className="text-muted-foreground text-sm">
              {product.ingredients_normalized.join(', ')}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              No ingredients listed
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
