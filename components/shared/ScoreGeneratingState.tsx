'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, Sparkles } from 'lucide-react'

interface ScoreProgress {
  current: number
  total: number
}

interface ScoresGeneratingStateProps {
  productProgress?: ScoreProgress | null
  routineProgress?: ScoreProgress | null
}

export function ScoreGeneratingState({
  productProgress,
  routineProgress,
}: ScoresGeneratingStateProps) {
  const productPercent = productProgress
    ? Math.round((productProgress.current / productProgress.total) * 100)
    : 0

  const routinePercent = routineProgress
    ? Math.round((routineProgress.current / routineProgress.total) * 100)
    : 0

  const productComplete = productProgress
    ? productProgress.current === productProgress.total &&
      productProgress.total > 0
    : false
  const routineComplete = routineProgress
    ? routineProgress.current === routineProgress.total &&
      routineProgress.total > 0
    : false

  return (
    <div className="flex justify-center px-6 pt-12 pb-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          </div>
          <CardTitle className="text-2xl">
            Generating Your Recommendations
          </CardTitle>
          <CardDescription>
            Analyzing products and routines for your hair profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Progress */}
          {productProgress &&
            productProgress.total > 0 && ( // ✅ FIXED
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {productComplete ? '✓ Products scored' : 'Scoring products'}
                  </span>
                  <span
                    className={
                      productComplete
                        ? 'text-primary font-medium'
                        : 'font-medium'
                    }
                  >
                    {productProgress.current.toLocaleString()} /{' '}
                    {productProgress.total.toLocaleString()}
                  </span>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${productComplete ? 'bg-green-500' : 'bg-primary'}`}
                    style={{ width: `${productPercent}%` }}
                  />
                </div>
                {!productComplete && (
                  <p className="text-muted-foreground text-center text-xs">
                    {productPercent}% complete
                  </p>
                )}
              </div>
            )}

          {/* Routine Progress */}
          {routineProgress && routineProgress.total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {routineComplete ? '✓ Routines scored' : 'Scoring routines'}
                </span>
                <span
                  className={
                    routineComplete ? 'text-primary font-medium' : 'font-medium'
                  }
                >
                  {routineProgress.current.toLocaleString()} /{' '}
                  {routineProgress.total.toLocaleString()}
                </span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className={`h-full transition-all duration-500 ease-out ${routineComplete ? 'bg-green-500' : 'bg-primary'}`}
                  style={{ width: `${routinePercent}%` }}
                />
              </div>
              {!routineComplete && (
                <p className="text-muted-foreground text-center text-xs">
                  {routinePercent}% complete
                </p>
              )}
            </div>
          )}

          {/* Status List */}
          <div className="bg-muted rounded-lg p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="text-primary h-4 w-4" />
              <p className="text-sm font-medium">What's happening:</p>
            </div>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>✓ Hair analysis complete</li>
              <li
                className={
                  productProgress && productProgress.current > 0
                    ? productComplete
                      ? 'font-medium text-green-600'
                      : 'text-primary font-medium'
                    : ''
                }
              >
                {productComplete
                  ? '✓'
                  : productProgress && productProgress.current > 0
                    ? '⏳'
                    : '○'}{' '}
                Scoring products for your follicle ID
              </li>
              <li
                className={
                  routineProgress && routineProgress.current > 0
                    ? routineComplete
                      ? 'font-medium text-green-600'
                      : 'text-primary font-medium'
                    : ''
                }
              >
                {routineComplete
                  ? '✓'
                  : routineProgress && routineProgress.current > 0
                    ? '⏳'
                    : '○'}{' '}
                Scoring community routines
              </li>
            </ul>{' '}
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-muted-foreground text-center text-xs font-medium">
              {productComplete && routineComplete
                ? 'Calculations finished! Redirecting to your matches...'
                : 'Customizing your results — please stay on this page.'}
            </p>

            {/* The "Safety" Disclaimer to prevent them from leaving */}
            <p className="text-muted-foreground/50 animate-pulse border-t pt-3 text-center text-[10px] tracking-widest uppercase">
              Do not refresh or navigate away
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
