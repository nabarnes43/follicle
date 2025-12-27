// components/landing/LandingPageClient.tsx
'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Sparkles,
  Users,
  Package,
  Database,
  Shield,
  TrendingUp,
  MessageSquare,
} from 'lucide-react'

export function LandingPageClient() {
  return (
    <div>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Algorithmic Hair Care Discovery
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Find Products That Actually Work For Your Hair
          </h1>
          <p className="text-muted-foreground mb-10 text-xl md:text-2xl">
            Take our 5-minute analysis to get personalized matches from 8,000+
            products with complete ingredient transparency.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="text-lg">
              <Link href="/analysis">Take Hair Analysis</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg">
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
          <p className="text-muted-foreground mt-6 text-sm">
            No credit card required • Free forever
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg">
              Three simple steps to personalized recommendations
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <Sparkles className="text-primary h-8 w-8" />
              </div>
              <div className="text-primary mb-2 text-4xl font-bold">1</div>
              <h3 className="mb-2 text-xl font-semibold">
                Take 5-Min Analysis
              </h3>
              <p className="text-muted-foreground">
                Answer questions about your hair texture, porosity, density, and
                goals.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <Users className="text-primary h-8 w-8" />
              </div>
              <div className="text-primary mb-2 text-4xl font-bold">2</div>
              <h3 className="mb-2 text-xl font-semibold">
                Get Your Follicle ID
              </h3>
              <p className="text-muted-foreground">
                We match you with people who have identical hair
                characteristics.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <Package className="text-primary h-8 w-8" />
              </div>
              <div className="text-primary mb-2 text-4xl font-bold">3</div>
              <h3 className="mb-2 text-xl font-semibold">
                Discover Perfect Matches
              </h3>
              <p className="text-muted-foreground">
                Browse products validated by your hair community with real
                reviews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            No More Trial and Error
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to find products that work
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          <div className="flex gap-4">
            <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
              <TrendingUp className="text-primary h-6 w-6" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                AI-Powered Matching
              </h3>
              <p className="text-muted-foreground">
                Our algorithm matches products to your exact hair profile using
                35+ parameters.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
              <Shield className="text-primary h-6 w-6" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Complete Transparency
              </h3>
              <p className="text-muted-foreground">
                See every ingredient with safety ratings and why it works for
                your hair type.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
              <MessageSquare className="text-primary h-6 w-6" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Community Validated
              </h3>
              <p className="text-muted-foreground">
                Real reviews from people with your exact Follicle ID who have
                similar hair.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
              <Database className="text-primary h-6 w-6" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">8,000+ Products</h3>
              <p className="text-muted-foreground">
                Comprehensive database covering every major brand and indie
                favorite.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Ready to Find Your Perfect Products?
          </h2>
          <p className="mb-8 text-lg opacity-90 md:text-xl">
            Join thousands discovering their ideal hair care routine
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg">
            <Link href="/analysis">Take Hair Analysis</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
