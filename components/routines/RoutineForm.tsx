'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/types/user'
import { Routine, RoutineStep } from '@/types/routine'
import { PreComputedProductMatchScore } from '@/types/productMatching'
import { RoutineStepCard } from '@/components/routines/RoutineStepCard'
import { RoutineStepCardSkeleton } from '@/components/routines/RoutineStepCardSkeleton'
import { FrequencySelector } from '@/components/routines/FrequencySelector'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/auth'
import { toast } from 'sonner'

interface RoutineFormProps {
  mode: 'create' | 'edit' | 'adapt'
  routineId?: string
  initialRoutine?: Routine
  userData: User
  productScores: PreComputedProductMatchScore[]
  loading?: boolean // NEW
}

export function RoutineForm({
  mode,
  routineId,
  initialRoutine,
  userData,
  productScores,
  loading = false, // NEW - default to false
}: RoutineFormProps) {
  const { user } = useAuth()
  const router = useRouter()

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const savedProductIds = userData.savedProducts || []
  const likedProductIds = userData.likedProducts || []

  const [routine, setRoutine] = useState<Routine>(
    initialRoutine || {
      id: '',
      user_id: userData.userId,
      follicle_id: userData.follicleId,
      name: '',
      description: '',
      steps: [],
      frequency: { interval: 1, unit: 'week' },
      is_public: false,
      created_at: null,
      updated_at: null,
    }
  )

  const getTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create Routine'
      case 'edit':
        return 'Edit Routine'
      case 'adapt':
        return 'Adapt Routine'
    }
  }

  const getButtonText = () => {
    if (isSaving) return 'Saving...'
    switch (mode) {
      case 'create':
        return 'Create Routine'
      case 'edit':
        return 'Save Changes'
      case 'adapt':
        return 'Save to My Routines'
    }
  }

  const handleAddStep = () => {
    const newStep: RoutineStep = {
      order: routine.steps.length + 1,
      step_name: 'Shampoos' as any,
      product_id: '',
      product_name: '',
      product_brand: '',
      product_image_url: null,
      amount: undefined,
      frequency: { interval: 1, unit: 'day' },
      notes: '',
      technique: undefined,
    }
    setRoutine({ ...routine, steps: [...routine.steps, newStep] })
  }

  const handleUpdateStep = (index: number, updatedStep: RoutineStep) => {
    const newSteps = [...routine.steps]

    // If product changed, update product metadata
    if (updatedStep.product_id !== newSteps[index].product_id) {
      const product = productScores.find(
        (p) => p.product.id === updatedStep.product_id
      )
      if (product) {
        updatedStep.product_name = product.product.name
        updatedStep.product_brand = product.product.brand
        updatedStep.product_image_url = product.product.image_url
      }
    }

    newSteps[index] = updatedStep
    setRoutine({ ...routine, steps: newSteps })
  }

  const handleDeleteStep = (index: number) => {
    const newSteps = routine.steps.filter((_, i) => i !== index)
    newSteps.forEach((step, i) => (step.order = i + 1))
    setRoutine({ ...routine, steps: newSteps })
  }

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= routine.steps.length) return

    const newSteps = [...routine.steps]
    const temp = newSteps[index]
    newSteps[index] = newSteps[newIndex]
    newSteps[newIndex] = temp

    newSteps.forEach((step, i) => (step.order = i + 1))
    setRoutine({ ...routine, steps: newSteps })
  }

  const validateRoutine = (): string | null => {
    if (routine.steps.length === 0) {
      return 'Please add at least one step to your routine.'
    }

    const invalidSteps = routine.steps.filter((step) => !step.product_id)
    if (invalidSteps.length > 0) {
      return 'All steps must have a product.'
    }

    if (!routine.name.trim()) {
      return 'Please enter a routine name.'
    }

    return null
  }

  const handleSave = async () => {
    setError(null)

    const validationError = validateRoutine()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    try {
      const token = await user?.getIdToken()

      if (mode === 'edit') {
        // EDIT - call /api/routines/[id]/edit
        const response = await fetch(`/api/routines/${routineId}/edit`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: routine.name,
            description: routine.description,
            steps: routine.steps,
            frequency: routine.frequency,
            is_public: routine.is_public,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update routine')
        }

        toast.success('Routine updated!')
        router.push(`/routines/${routineId}`)
        router.refresh()
      } else if (mode === 'adapt') {
        // ADAPT - call /api/routines/[id]/adapt
        const response = await fetch(`/api/routines/${routineId}/adapt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(routine),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to adapt routine')
        }

        toast.success('Routine adapted!')
        router.push('/routines/private')
      } else {
        // CREATE - call /api/routines/create
        const response = await fetch('/api/routines/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(routine),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create routine')
        }

        toast.success('Routine created!')

        // Reset form state before redirect
        setRoutine({
          id: '',
          user_id: userData.userId,
          follicle_id: userData.follicleId,
          name: '',
          description: '',
          steps: [],
          frequency: { interval: 1, unit: 'week' },
          is_public: false,
          created_at: null as any,
          updated_at: null as any,
        })

        router.push('/routines/private')
      }
    } catch (error) {
      console.error('Failed to save routine:', error)
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to save routine. Please try again.'
      )
    } finally {
      setIsSaving(false)
    }
  }
  //TODO shared form loading state
  // SKELETON LOADING STATE
  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-48" />
        </div>

        {/* Routine Name */}
        <div className="mb-6">
          <Skeleton className="mb-2 h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Description */}
        <div className="mb-6">
          <Skeleton className="mb-2 h-4 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>

        {/* Frequency */}
        <div className="mb-8">
          <Skeleton className="mb-2 h-4 w-48" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Public/Private Toggle */}
        <div className="mb-8">
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>

        {/* Steps */}
        <div className="mb-6">
          <Skeleton className="mb-4 h-8 w-24" />
          <div className="space-y-4">
            <RoutineStepCardSkeleton />
            <RoutineStepCardSkeleton />
            <RoutineStepCardSkeleton />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 border-t pt-4">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-24" />
        </div>
      </div>
    )
  }

  // ACTUAL FORM (when not loading)
  return (
    <div className="container mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button onClick={() => router.back()} variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{getTitle()}</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Routine Name */}
      <div className="mb-6">
        <Label htmlFor="routine-name">Routine Name *</Label>
        <Input
          id="routine-name"
          value={routine.name}
          onChange={(e) => setRoutine({ ...routine, name: e.target.value })}
          placeholder="My Hair Routine"
          className="mt-1"
        />
      </div>

      {/* Description */}
      <div className="mb-6">
        <Label htmlFor="routine-description">Description (optional)</Label>
        <Textarea
          id="routine-description"
          value={routine.description || ''}
          onChange={(e) =>
            setRoutine({ ...routine, description: e.target.value })
          }
          placeholder="Describe your routine..."
          rows={3}
          className="mt-1"
        />
      </div>

      {/* Overall Frequency */}
      <div className="mb-8">
        <FrequencySelector
          value={routine.frequency}
          onChange={(freq) => setRoutine({ ...routine, frequency: freq })}
          label="How Often Do You Do This Routine?"
        />
      </div>

      {/* Public/Private Toggle */}
      <div className="mb-8 flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="public-toggle">Make Routine Public</Label>
          <p className="text-muted-foreground text-sm">
            Allow others with similar hair to discover your routine
          </p>
        </div>
        <Switch
          id="public-toggle"
          checked={routine.is_public}
          onCheckedChange={(checked) =>
            setRoutine({ ...routine, is_public: checked })
          }
        />
      </div>

      {/* Steps Section */}
      <div className="mb-6">
        <h2 className="mb-4 text-2xl font-bold">Steps</h2>

        {routine.steps.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No steps yet. Add your first step to get started!
            </p>
            <Button onClick={handleAddStep} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add First Step
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {routine.steps.map((step, index) => (
                <RoutineStepCard
                  key={step.order}
                  step={step}
                  stepNumber={index + 1}
                  onUpdate={(updatedStep) =>
                    handleUpdateStep(index, updatedStep)
                  }
                  onDelete={() => handleDeleteStep(index)}
                  onMoveUp={() => handleMoveStep(index, 'up')}
                  onMoveDown={() => handleMoveStep(index, 'down')}
                  isFirst={index === 0}
                  isLast={index === routine.steps.length - 1}
                  productScores={productScores}
                  savedProductIds={savedProductIds}
                  likedProductIds={likedProductIds}
                />
              ))}
            </div>

            <Button
              onClick={handleAddStep}
              variant="outline"
              className="mt-4 w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Step
            </Button>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-background sticky bottom-4 flex gap-4 border-t pt-4">
        <Button
          onClick={handleSave}
          size="lg"
          disabled={isSaving || !routine.name || routine.steps.length === 0}
          className="flex-1"
        >
          {getButtonText()}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.back()}
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
