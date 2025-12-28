// components/shared/DetailPageSkeleton.tsx
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function DetailPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="mb-4" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Skeleton className="mb-2 h-9 w-3/4" />
          <Skeleton className="mb-3 h-6 w-1/4" />
          <Skeleton className="h-8 w-32" />
        </div>

        {/* Image */}
        <Skeleton className="mb-6 h-[500px] w-full rounded-lg" />

        {/* Content Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <Skeleton className="mb-4 h-6 w-40" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
