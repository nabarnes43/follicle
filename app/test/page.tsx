// app/test/page.tsx Test Page For New Components
'use client'

import { useState } from 'react'
import { FrequencySelector } from '@/components/routines/FrequencySelector'
import { Frequency } from '@/types/routine'
import { ProductSearch } from '@/components/products/ProductsSearch'

export default function TestPage() {
  const [frequency, setFrequency] = useState<Frequency>({
    interval: 1,
    unit: 'day',
  })

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

          {/* Debug Output */}
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
              // Do something with the selected product
              // Like add it to the step's product list
              console.log('User selected:', product)
            }}
          />
        </div>

        {/* Add more test sections here as we build components */}
      </div>
    </div>
  )
}
