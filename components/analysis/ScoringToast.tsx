'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth'
import { doc, onSnapshot, updateDoc, deleteField } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { Loader2, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ScoringStatus = 'in_progress' | 'complete' | 'failed' | null

interface ScoringProgress {
  products: number
  totalProducts: number
  routines: number
  totalRoutines: number
}

export function ScoringToast() {
  const { user } = useAuth()
  const [status, setStatus] = useState<ScoringStatus>(null)
  const [progress, setProgress] = useState<ScoringProgress | null>(null)
  const [dismissed, setDismissed] = useState(false)

  // Listen to scoringStatus on user doc
  useEffect(() => {
    if (!user?.uid) return

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      const data = snapshot.data()
      const newStatus = (data?.scoringStatus as ScoringStatus) || null

      setStatus(newStatus)

      if (newStatus === 'in_progress') {
        setDismissed(false)
      }
    })

    return () => unsubscribe()
  }, [user?.uid])

  // Listen to progress on subcollection
  useEffect(() => {
    if (!user?.uid || status !== 'in_progress') return

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid, 'scoring_status', 'current'),
      (snapshot) => {
        const data = snapshot.data()
        if (data) {
          setProgress(data as ScoringProgress)
        }
      }
    )

    return () => unsubscribe()
  }, [user?.uid, status])

  const handleRefresh = async () => {
    if (!user?.uid) return

    await updateDoc(doc(db, 'users', user.uid), {
      scoringStatus: deleteField(),
    })

    window.location.reload()
  }

  // Don't render if nothing to show
  if (!status || status === 'failed' || dismissed) return null

  const productPercent =
    progress && progress.totalProducts > 0
      ? Math.round((progress.products / progress.totalProducts) * 100)
      : 0

  const routinePercent =
    progress && progress.totalRoutines > 0
      ? Math.round((progress.routines / progress.totalRoutines) * 100)
      : 0

  return (
    <div className="fixed right-4 bottom-4 z-50 w-80">
      <div className="bg-card rounded-lg border p-4 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status === 'in_progress' ? (
              <Loader2 className="text-primary h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="text-primary h-4 w-4" />
            )}
            <p className="text-sm font-medium">
              {status === 'in_progress'
                ? 'Personalizing recommendations...'
                : 'Your personalized results are ready!'}
            </p>
          </div>
          {status === 'complete' && (
            <button
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Progress when in_progress */}
        {status === 'in_progress' && progress && (
          <div className="mt-3 space-y-2">
            {/* Products */}
            {progress.totalProducts > 0 && (
              <div className="space-y-1">
                <div className="text-muted-foreground flex justify-between text-xs">
                  <span>Products</span>
                  <span>
                    {progress.products.toLocaleString()} /{' '}
                    {progress.totalProducts.toLocaleString()}
                  </span>
                </div>
                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(progress.products / progress.totalProducts) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Routines */}
            {progress.totalRoutines > 0 && (
              <div className="space-y-1">
                <div className="text-muted-foreground flex justify-between text-xs">
                  <span>Routines</span>
                  <span>
                    {progress.routines.toLocaleString()} /{' '}
                    {progress.totalRoutines.toLocaleString()}
                  </span>
                </div>
                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(progress.routines / progress.totalRoutines) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <p className="text-muted-foreground text-xs">
              Feel free to browse around.
            </p>
          </div>
        )}

        {/* Complete state */}
        {status === 'complete' && (
          <Button size="sm" className="mt-3 w-full" onClick={handleRefresh}>
            Refresh for scores
          </Button>
        )}
      </div>
    </div>
  )
}
