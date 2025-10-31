'use client'

import { useState, useEffect } from 'react'
import { FrequencySelector } from '@/components/routines/FrequencySelector'
import { ProductSearch } from '@/components/products/ProductsSearch'
import { RoutineStepCard } from '@/components/routines/RoutineStepCard'
import { Frequency, RoutineStep } from '@/types/routine'
import { Product } from '@/types/product'
import { productsCache } from '@/lib/matching/productsCache'

export default function TestPage() {
  const [frequency, setFrequency] = useState<Frequency>({
    interval: 1,
    unit: 'day',
  })

  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])

  const [testStep, setTestStep] = useState<RoutineStep>({
    order: 1,
    step_name: 'Shampoo',
    products: [],
    frequency: { interval: 2, unit: 'week', days_of_week: ['Mo', 'We', 'Fr'] },
    notes: '',
    technique: '',
  })

  // Load products once
  useEffect(() => {
    productsCache.getProducts().then(setAllProducts)
  }, [])

  return (
    <div className="container mx-auto max-w-2xl p-8">
      <h1 className="mb-8 text-3xl font-bold">Component Test Page</h1>

      {/* Test Section */}
      <div className="space-y-8">
        {/* FrequencySelector Test */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">FrequencySelector</h2>

          <FrequencySelector
            value={frequency}
            onChange={setFrequency}
            label="Test Frequency"
          />

          <div className="bg-muted mt-4 rounded p-4">
            <p className="mb-2 text-sm font-medium">Current Value:</p>
            <pre className="text-xs">{JSON.stringify(frequency, null, 2)}</pre>
          </div>
        </div>

        {/* ProductSearch Test */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">ProductSearch</h2>

          <ProductSearch
            onSelect={(product) => {
              setSelectedProducts([...selectedProducts, product])
            }}
            excludeIds={selectedProducts.map((p) => p.id)}
          />

          <div className="bg-muted mt-4 rounded p-4">
            <p className="mb-2 text-sm font-medium">Selected Products:</p>
            {selectedProducts.length > 0 ? (
              <ul className="space-y-1 text-xs">
                {selectedProducts.map((p) => (
                  <li key={p.id}>
                    {p.brand} - {p.name} - ${p.price}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-xs">None selected</p>
            )}
          </div>
        </div>

        {/* RoutineStepCard Test */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">RoutineStepCard</h2>

          <RoutineStepCard
            step={testStep}
            stepNumber={1}
            onUpdate={setTestStep}
            onDelete={() => console.log('Delete step')}
            allProducts={allProducts}
          />

          <div className="bg-muted mt-4 rounded p-4">
            <p className="mb-2 text-sm font-medium">Current Step Value:</p>
            <pre className="overflow-auto text-xs">
              {JSON.stringify(testStep, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
