'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProductSearch } from '@/components/routines/ProductsSearch'
import { Product } from '@/types/product'

export default function ProductSearchTest() {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])

  return (
    <div className="container mx-auto max-w-2xl p-8">
      <Link
        href="/test"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="mb-8 text-3xl font-bold">ProductSearch</h1>

      <div className="space-y-6">
        <ProductSearch
          onSelect={(product) => {
            setSelectedProducts([...selectedProducts, product])
          }}
          excludeIds={selectedProducts.map((p) => p.id)}
        />

        <div className="bg-muted rounded p-4">
          <p className="mb-2 text-sm font-medium">
            Selected: {selectedProducts.length}
          </p>
          <pre className="text-xs">
            {JSON.stringify(
              selectedProducts.map((p) => ({
                id: p.id,
                brand: p.brand,
                name: p.name,
              })),
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  )
}
