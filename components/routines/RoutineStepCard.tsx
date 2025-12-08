'use client'

import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FrequencySelector } from './FrequencySelector'
import { RoutineStep } from '@/types/routine'
import { PreComputedProductMatchScore } from '@/types/productMatching'
import { Trash2, X, ChevronUp, ChevronDown } from 'lucide-react'
import { ProductSearch } from './ProductsSearch'
import {
  TECHNIQUES,
  AMOUNTS,
  Amount,
  Technique,
} from '@/lib/constants/routineBuilder'
import { ProductCategory } from '@/lib/constants/categories'

interface RoutineStepCardProps {
  step: RoutineStep
  stepNumber: number
  onUpdate: (updatedStep: RoutineStep) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  productScores: PreComputedProductMatchScore[] // CHANGED: from allProducts
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
  productScores,
  isFirst = false,
  isLast = false,
  savedProductIds = [],
  likedProductIds = [],
}: RoutineStepCardProps) {
  // Find the product from productScores
  const productMatch = productScores.find(
    (ps) => ps.product.id === step.product_id
  )
  const product = productMatch?.product

  const handleAddProduct = (selectedMatch: PreComputedProductMatchScore) => {
    onUpdate({
      ...step,
      step_name: selectedMatch.product.category as ProductCategory,
      product_id: selectedMatch.product.id,
    })
  }

  const handleRemoveProduct = () => {
    onUpdate({
      ...step,
      product_id: '',
      step_name: 'Shampoos', // Reset to default
    })
  }

  const handleUpdateAmount = (amount: Amount) => {
    onUpdate({
      ...step,
      amount,
    })
  }

  const handleUpdateTechnique = (technique: Technique) => {
    onUpdate({
      ...step,
      technique,
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

      {/* Product */}
      <div className="mb-4">
        <Label>Product *</Label>

        {product ? (
          <div className="bg-muted/30 flex items-center gap-2 rounded border p-2">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-10 w-10 rounded bg-white object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                <span className="text-xs text-gray-400">No img</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs">{product.brand}</p>
              <p className="truncate text-sm font-medium">{product.name}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemoveProduct}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <ProductSearch
            onSelect={handleAddProduct}
            excludeIds={[]}
            placeholder="Select a product for this step..."
            savedProductIds={savedProductIds}
            likedProductIds={likedProductIds}
            productScores={productScores}
          />
        )}
      </div>

      {/* Amount Dropdown */}
      <div className="mb-4">
        <Label htmlFor={`amount-${step.order}`}>Amount (optional)</Label>
        <Select
          value={step.amount || ''} // Convert undefined to empty string for Select
          onValueChange={(value) => handleUpdateAmount(value as Amount)} // Cast to Amount
        >
          <SelectTrigger id={`amount-${step.order}`} className="mt-1">
            <SelectValue placeholder="Select amount..." />
          </SelectTrigger>
          <SelectContent>
            {AMOUNTS.map((amount) => (
              <SelectItem key={amount} value={amount}>
                {amount}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Frequency */}
      <div className="mb-4">
        <FrequencySelector
          value={step.frequency}
          onChange={(freq) => onUpdate({ ...step, frequency: freq })}
          label="Step Frequency"
        />
      </div>

      {/* Technique Dropdown */}
      <div className="mb-4">
        <Label htmlFor={`technique-${step.order}`}>Technique (optional)</Label>
        <Select
          value={step.technique || ''} // Convert undefined to empty string for Select
          onValueChange={(value) => handleUpdateTechnique(value as Technique)} // Cast to Technique
        >
          <SelectTrigger id={`technique-${step.order}`} className="mt-1">
            <SelectValue placeholder="Select technique..." />
          </SelectTrigger>
          <SelectContent>
            {TECHNIQUES.map((technique) => (
              <SelectItem key={technique} value={technique}>
                {technique}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
