// app/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function LandingLoading() {
  return (
    <div>
      {/* Hero Section Skeleton */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge skeleton */}
          <Skeleton className="mx-auto mb-6 h-8 w-64" />

          {/* Headline skeleton */}
          <Skeleton className="mx-auto mb-4 h-16 w-full max-w-3xl" />
          <Skeleton className="mx-auto mb-6 h-16 w-full max-w-2xl" />

          {/* Subheadline skeleton */}
          <Skeleton className="mx-auto mb-4 h-6 w-full max-w-2xl" />
          <Skeleton className="mx-auto mb-10 h-6 w-full max-w-xl" />

          {/* CTA buttons skeleton */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Skeleton className="h-12 w-full sm:w-48" />
            <Skeleton className="h-12 w-full sm:w-48" />
          </div>

          {/* Trust signal skeleton */}
          <Skeleton className="mx-auto mt-6 h-4 w-64" />
        </div>
      </section>

      {/* How It Works Section Skeleton */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <Skeleton className="mx-auto mb-4 h-10 w-64" />
            <Skeleton className="mx-auto h-6 w-96" />
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <Skeleton className="mx-auto mb-4 h-16 w-16 rounded-full" />
                <Skeleton className="mx-auto mb-2 h-12 w-12" />
                <Skeleton className="mx-auto mb-2 h-6 w-48" />
                <Skeleton className="mx-auto h-4 w-full" />
                <Skeleton className="mx-auto mt-2 h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section Skeleton */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mb-12 text-center">
          <Skeleton className="mx-auto mb-4 h-10 w-80" />
          <Skeleton className="mx-auto h-6 w-64" />
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="mb-2 h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section Skeleton */}
      <section className="bg-primary py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <Skeleton className="bg-primary-foreground/20 mx-auto mb-4 h-10 w-96" />
          <Skeleton className="bg-primary-foreground/20 mx-auto mb-8 h-6 w-80" />
          <Skeleton className="bg-primary-foreground/20 mx-auto h-12 w-48" />
        </div>
      </section>
    </div>
  )
}
