'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { User } from '@/types/user'
import { Routine, RoutineStep } from '@/types/routine'
import { Product } from '@/types/product'
import { RoutineStepCard } from '@/components/routines/RoutineStepCard'
import { FrequencySelector } from '@/components/routines/FrequencySelector'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { productsCache } from '@/lib/matching/productsCache'
import { Plus } from 'lucide-react'
import { useAuth } from '@/contexts/auth'

function CreateRoutineContent({ userData }: { userData: User }) {
  const { user } = useAuth()
  const router = useRouter()
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const savedProductIds = userData.savedProducts || []
  const likedProductIds = userData.likedProducts || []
  const [routine, setRoutine] = useState<Routine>({
    id: '',
    user_id: userData.userId,
    follicle_id: userData.follicleId,
    name: '',
    description: '',
    steps: [],
    frequency: { interval: 1, unit: 'week' },
    is_public: false,
    created_at: new Date(),
    updated_at: new Date(),
  })

  // Load products once
  useEffect(() => {
    productsCache.getProducts().then(setAllProducts)
  }, [])

  const handleAddStep = () => {
    const newStep: RoutineStep = {
      order: routine.steps.length + 1,
      step_name: '',
      products: [],
      frequency: { interval: 1, unit: 'day' },
      notes: '',
      technique: '',
    }
    setRoutine({ ...routine, steps: [...routine.steps, newStep] })
  }

  const handleUpdateStep = (index: number, updatedStep: RoutineStep) => {
    const newSteps = [...routine.steps]
    newSteps[index] = updatedStep
    setRoutine({ ...routine, steps: newSteps })
  }

  const handleDeleteStep = (index: number) => {
    const newSteps = routine.steps.filter((_, i) => i !== index)
    // Reorder remaining steps
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

    // Update order numbers
    newSteps.forEach((step, i) => (step.order = i + 1))
    setRoutine({ ...routine, steps: newSteps })
  }

  const validateRoutine = (): string | null => {
    if (routine.steps.length === 0) {
      return 'Please add at least one step to your routine.'
    }

    const invalidSteps = routine.steps.filter((step) => !step.step_name.trim())
    if (invalidSteps.length > 0) {
      return 'All steps must have a name.'
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
      const token = await user?.getIdToken() //

      const response = await fetch('/api/routines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(routine),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save routine')
      }

      console.log('✅ Routine saved:', data.routineId)
      router.push('/profile')
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

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="mb-8 text-3xl font-bold">Create Routine</h1>

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
                  allProducts={allProducts}
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
          {isSaving ? 'Saving...' : 'Save Routine'}
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

export default function CreateRoutinePage() {
  return (
    <RequireAuth requireFollicleId>
      {(userData) => <CreateRoutineContent userData={userData} />}
    </RequireAuth>
  )
}
