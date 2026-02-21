'use client'

import { User } from '@/types/user'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Copy,
  Check,
  Heart,
  Bookmark,
  ThumbsDown,
  ClipboardCheck,
  AlertTriangle,
  Ban,
  ShoppingBag,
  ArrowLeft,
} from 'lucide-react'
import { decodeFollicleIdForDisplay } from '@/functions/src/shared/follicleId'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface PublicProfileContentProps {
  userData: User
  stats: {
    products: {
      liked: number
      disliked: number
      saved: number
    }
    routines: {
      created: number
      liked: number
      disliked: number
      saved: number
      adapted: number
    }
    ingredients: {
      liked: number
      disliked: number
      avoided: number
      allergic: number
    }
  }
}

export default function PublicProfileContent({
  userData,
  stats,
}: PublicProfileContentProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const copyFollicleId = () => {
    if (userData.follicleId) {
      navigator.clipboard.writeText(userData.follicleId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Format wash frequency: "every2-3" → "Every 2-3 days"
  const formatWashFrequency = (freq: string) => {
    const map: Record<string, string> = {
      daily: 'Daily',
      'every2-3': 'Every 2-3 days',
      weekly: 'Weekly',
      biweekly: 'Every 2 weeks',
    }
    return map[freq] || freq
  }

  const decoded = userData.follicleId
    ? decodeFollicleIdForDisplay(userData.follicleId)
    : null
  const follicleIdDescription = decoded
    ? Object.values(decoded).join(' • ')
    : 'No analysis completed'
  const hair = userData.hairAnalysis
  const memberSince = userData.createdAt
    ? new Date(
        (userData.createdAt as any).toDate?.() || userData.createdAt
      ).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Unknown'

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {/* Profile Header */}
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold">
            {userData.displayName || 'Anonymous User'}
          </h1>
          <p className="text-muted-foreground text-sm">
            Member since {memberSince}
          </p>
        </div>

        {/* Follicle ID Card */}
        <Card>
          <CardHeader>
            <CardTitle>Follicle ID</CardTitle>
            <CardDescription>Hair characteristics profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted flex items-center justify-between rounded-lg p-4">
              <div>
                <p className="text-primary mb-2 font-mono text-3xl font-bold">
                  {userData.follicleId}
                </p>
                <p className="text-muted-foreground text-sm">
                  {follicleIdDescription}
                </p>
              </div>
              <Button variant="outline" size="icon" onClick={copyFollicleId}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats - Products */}
        <Card
          className="cursor-pointer transition-shadow hover:shadow-lg"
          onClick={() => router.push(`/profile/${userData.userId}/products`)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Product Activity
            </CardTitle>
            <CardDescription>
              Interactions with hair care products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Heart className="text-muted-foreground h-4 w-4" />
                <span className="font-semibold">{stats.products.liked}</span>
                <span className="text-muted-foreground">Liked</span>
              </div>
              <div className="flex items-center gap-2">
                <Bookmark className="text-muted-foreground h-4 w-4" />
                <span className="font-semibold">{stats.products.saved}</span>
                <span className="text-muted-foreground">Saved</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsDown className="text-muted-foreground h-4 w-4" />
                <span className="font-semibold">{stats.products.disliked}</span>
                <span className="text-muted-foreground">Disliked</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats - Routines */}
        <Card
          className="cursor-pointer transition-shadow hover:shadow-lg"
          onClick={() => router.push(`/profile/${userData.userId}/routines`)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Routine Activity
            </CardTitle>
            <CardDescription>Created and saved hair routines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="text-muted-foreground h-4 w-4" />
                <span className="font-semibold">{stats.routines.created}</span>
                <span className="text-muted-foreground">Created</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="text-muted-foreground h-4 w-4" />
                <span className="font-semibold">{stats.routines.liked}</span>
                <span className="text-muted-foreground">Liked</span>
              </div>
              <div className="flex items-center gap-2">
                <Bookmark className="text-muted-foreground h-4 w-4" />
                <span className="font-semibold">{stats.routines.saved}</span>
                <span className="text-muted-foreground">Saved</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsDown className="text-muted-foreground h-4 w-4" />
                <span className="font-semibold">{stats.routines.disliked}</span>
                <span className="text-muted-foreground">Disliked</span>
              </div>
              <div className="flex items-center gap-2">
                <Copy className="text-muted-foreground h-4 w-4" />
                <span className="font-semibold">{stats.routines.adapted}</span>
                <span className="text-muted-foreground">Adapted</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats - Ingredients */}
        <Card
          className="cursor-pointer transition-shadow hover:shadow-lg"
          onClick={() => router.push(`/profile/${userData.userId}/ingredients`)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Ingredient Activity
            </CardTitle>
            <CardDescription>
              Ingredient preferences and sensitivities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Heart className="text-muted-foreground h-4 w-4" />
                <span className="font-semibold">{stats.ingredients.liked}</span>
                <span className="text-muted-foreground">Liked</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsDown className="text-muted-foreground h-4 w-4" />
                <span className="font-semibold">
                  {stats.ingredients.disliked}
                </span>
                <span className="text-muted-foreground">Disliked</span>
              </div>
              <div className="flex items-center gap-2">
                <Ban className="text-muted-foreground h-4 w-4" />
                <span className="font-semibold">
                  {stats.ingredients.avoided}
                </span>
                <span className="text-muted-foreground">Avoided</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-muted-foreground h-4 w-4" />
                <span className="font-semibold">
                  {stats.ingredients.allergic}
                </span>
                <span className="text-muted-foreground">Allergic</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hair Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Hair Analysis</CardTitle>
            <CardDescription>Complete hair profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Core 5 parameters */}
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Hair Type</p>
                <p className="text-lg font-semibold capitalize">
                  {hair?.hairType || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Porosity</p>
                <p className="text-lg font-semibold capitalize">
                  {hair?.porosity || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Density</p>
                <p className="text-lg font-semibold capitalize">
                  {hair?.density || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Thickness</p>
                <p className="text-lg font-semibold capitalize">
                  {hair?.thickness || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Damage</p>
                <p className="text-lg font-semibold capitalize">
                  {hair?.damage || 'N/A'}
                </p>
              </div>

              {/* Optional parameters */}
              {hair?.length && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">Length</p>
                  <p className="text-lg font-semibold capitalize">
                    {hair.length}
                  </p>
                </div>
              )}
              {hair?.scalpType && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    Scalp Type
                  </p>
                  <p className="text-lg font-semibold capitalize">
                    {hair.scalpType}
                  </p>
                </div>
              )}
              {hair?.mainGoal && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    Main Goal
                  </p>
                  <p className="text-lg font-semibold capitalize">
                    {hair.mainGoal}
                  </p>
                </div>
              )}
              {hair?.washFrequency && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    Wash Frequency
                  </p>
                  <p className="text-lg font-semibold">
                    {formatWashFrequency(hair.washFrequency)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
