import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FormPageSkeleton() {
  return (
    <div>
      <div className="container mx-auto px-4 pt-4">
        <Button variant="ghost" size="sm" disabled>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="container mx-auto px-4 pt-4">
        <Skeleton className="mb-2 h-9 w-48" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="container mx-auto max-w-xl space-y-5 px-4 py-6">
        {/* 5 field skeletons matching the form */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}

        {/* Image upload area */}
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-36 w-full rounded-md" />
        </div>

        {/* Submit button */}
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
