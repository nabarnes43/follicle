'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RoutineStepCard } from '@/components/routines/RoutineStepCard'
import { RoutineStep } from '@/types/routine'
import { Product } from '@/types/product'
import { productsCache } from '@/lib/matching/products/productsCache'

export default function RoutineStepCardTest() {
  const [step, setStep] = useState<RoutineStep>({
    order: 1,
    step_name: 'Shampoo',
    products: [],
    frequency: { interval: 2, unit: 'week', days_of_week: ['Mo', 'We', 'Fr'] },
    notes: '',
    technique: '',
  })
  const [allProducts, setAllProducts] = useState<Product[]>([])

  useEffect(() => {
    productsCache.getProducts().then(setAllProducts)
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

      <h1 className="mb-8 text-3xl font-bold">RoutineStepCard</h1>

      <div className="space-y-6">
        <RoutineStepCard
          step={step}
          stepNumber={1}
          onUpdate={setStep}
          onDelete={() => console.log('Delete clicked')}
          allProducts={allProducts}
        />

        <div className="bg-muted rounded p-4">
          <pre className="text-xs">{JSON.stringify(step, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}
