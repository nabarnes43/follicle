'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FrequencySelector } from './FrequencySelector'
import { SUGGESTED_STEP_NAMES, RoutineStep } from '@/types/routine'
import { Product } from '@/types/product'
import { Trash2, X, ChevronUp, ChevronDown } from 'lucide-react'
import { ProductSearch } from '../products/ProductsSearch'

interface RoutineStepCardProps {
  step: RoutineStep
  stepNumber: number
  onUpdate: (updatedStep: RoutineStep) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  allProducts: Product[]
  isFirst?: boolean
  isLast?: boolean
  savedProductIds?: string[]
  likedProductIds?: string[]
}

export function RoutineStepCard({
  step,
  stepNumber,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  allProducts,
  isFirst = false,
  isLast = false,
  savedProductIds = [],
  likedProductIds = [],
}: RoutineStepCardProps) {
  // Find full product details from IDs
  const stepProducts = step.products
    .map((sp) => {
      const product = allProducts.find((p) => p.id === sp.product_id)
      return { ...sp, product }
    })
    .filter((sp) => sp.product)

  const handleAddProduct = (product: Product) => {
    onUpdate({
      ...step,
      products: [...step.products, { product_id: product.id, amount: '' }],
    })
  }

  const handleRemoveProduct = (productId: string) => {
    onUpdate({
      ...step,
      products: step.products.filter((p) => p.product_id !== productId),
    })
  }

  const handleUpdateAmount = (productId: string, amount: string) => {
    onUpdate({
      ...step,
      products: step.products.map((p) =>
        p.product_id === productId ? { ...p, amount } : p
      ),
    })
  }

  return (
    <Card className="p-6">
      {/* Header: Step number, reorder buttons, delete */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
            {stepNumber}
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMoveUp}
              disabled={isFirst}
              className="h-8 w-8"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onMoveDown}
              disabled={isLast}
              className="h-8 w-8"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Step Name with native datalist */}
      <div className="mb-4">
        <Label htmlFor={`step-name-${step.order}`}>Step Name *</Label>
        <Input
          id={`step-name-${step.order}`}
          list={`step-suggestions-${step.order}`}
          value={step.step_name}
          onChange={(e) => onUpdate({ ...step, step_name: e.target.value })}
          placeholder="e.g., Shampoo, Deep Condition..."
          className="mt-1 w-full"
        />
        <datalist id={`step-suggestions-${step.order}`}>
          {SUGGESTED_STEP_NAMES.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>

      {/* Products List */}
      <div className="mb-4">
        <Label>Products</Label>
        <div className="mb-3 space-y-2">
          {stepProducts.map((sp) => (
            <div
              key={sp.product_id}
              className="bg-muted/30 flex items-center gap-2 rounded border p-2"
            >
              {sp.product?.image_url ? (
                <img
                  src={sp.product.image_url}
                  alt={sp.product.name}
                  className="h-10 w-10 rounded bg-white object-contain"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                  <span className="text-xs text-gray-400">No img</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs">
                  {sp.product?.brand}
                </p>
                <p className="truncate text-sm font-medium">
                  {sp.product?.name}
                </p>
              </div>
              <Input
                placeholder="Amount"
                value={sp.amount || ''}
                onChange={(e) =>
                  handleUpdateAmount(sp.product_id, e.target.value)
                }
                className="w-32"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveProduct(sp.product_id)}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <ProductSearch
          onSelect={handleAddProduct}
          excludeIds={step.products.map((p) => p.product_id)}
          placeholder="Add product to this step..."
          savedProductIds={savedProductIds}
          likedProductIds={likedProductIds}
        />
      </div>

      {/* Frequency */}
      <div className="mb-4">
        <FrequencySelector
          value={step.frequency}
          onChange={(freq) => onUpdate({ ...step, frequency: freq })}
          label="Step Frequency"
        />
      </div>

      {/* Technique */}
      <div className="mb-4">
        <Label htmlFor={`technique-${step.order}`}>Technique (optional)</Label>
        <Textarea
          id={`technique-${step.order}`}
          value={step.technique || ''}
          onChange={(e) => onUpdate({ ...step, technique: e.target.value })}
          placeholder="e.g., Scrunch, rake through, prayer hands..."
          rows={2}
          className="mt-1"
        />
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor={`notes-${step.order}`}>Notes (optional)</Label>
        <Textarea
          id={`notes-${step.order}`}
          value={step.notes || ''}
          onChange={(e) => onUpdate({ ...step, notes: e.target.value })}
          placeholder="Additional notes about this step..."
          rows={2}
          className="mt-1"
        />
      </div>
    </Card>
  )
}
