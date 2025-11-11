'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RoutineCard } from '@/components/routines/RoutineCard'
import { Routine } from '@/types/routine'
import { Product } from '@/types/product'
import { productsCache } from '@/lib/matching/products/productsCache'

export default function RoutineCardTest() {
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])

  useEffect(() => {
    productsCache.getProducts().then((products) => {
      setAllProducts(products)

      if (products.length >= 3) {
        setRoutine({
          id: 'test-routine-1',
          user_id: 'test-user',
          follicle_id: 'test-follicle',
          name: 'Moisture Routine',
          description: 'Deep conditioning routine for dry hair',
          frequency: { interval: 1, unit: 'week' },
          steps: [
            {
              order: 1,
              step_name: 'Shampoo',
              products: [
                { product_id: products[0].id, amount: 'Quarter-sized' },
                { product_id: products[1].id, amount: 'Dime-sized' },
              ],
              frequency: { interval: 1, unit: 'week' },
              technique: 'Focus on scalp',
              notes: 'Use lukewarm water',
            },
            {
              order: 2,
              step_name: 'Deep Condition',
              products: [
                { product_id: products[2].id, amount: '2 tablespoons' },
              ],
              frequency: { interval: 1, unit: 'week' },
            },
            {
              order: 3,
              step_name: 'Deep Condition',
              products: [
                { product_id: products[3].id, amount: '2 tablespoons' },
              ],
              frequency: { interval: 1, unit: 'week' },
            },
            {
              order: 4,
              step_name: 'Deep Condition',
              products: [
                { product_id: products[4].id, amount: '2 tablespoons' },
              ],
              frequency: { interval: 1, unit: 'week' },
            },
          ],
          is_public: true,
          created_at: { seconds: Date.now() / 1000 } as any,
          updated_at: { seconds: Date.now() / 1000 } as any,
          deleted_at: null,
        })
      }
    })
  }, [])

  return (
    <div className="container mx-auto max-w-2xl p-8">
      <Link
        href="/test"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="mb-8 text-3xl font-bold">RoutineCard</h1>

      <div className="space-y-6">
        {routine ? (
          <>
            <RoutineCard
              routine={routine}
              allProducts={allProducts}
              onView={() => console.log('View clicked')}
              onShare={() => console.log('Share clicked')}
              onDelete={() => console.log('Delete clicked')}
            />

            <div className="bg-muted rounded p-4">
              <pre className="text-xs">{JSON.stringify(routine, null, 2)}</pre>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Loading...</p>
        )}
      </div>
    </div>
  )
}
