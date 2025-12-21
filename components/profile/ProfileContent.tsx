'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Copy,
  Check,
  Heart,
  Bookmark,
  ThumbsDown,
  RefreshCw,
  LogOut,
  UserPlus,
} from 'lucide-react'
import AuthDialog from '@/components/auth/AuthDialog'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { decodeFollicleIdForDisplay } from '@/functions/src/shared/follicleId'

interface ProfileContentProps {
  userData: User // ✅ No longer optional
}

export default function ProfileContent({ userData }: ProfileContentProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showRetakeDialog, setShowRetakeDialog] = useState(false)

  const copyFollicleId = () => {
    if (userData.follicleId) {
      navigator.clipboard.writeText(userData.follicleId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
    router.push('/')
  }

  const handleRetakeAnalysis = () => {
    setShowRetakeDialog(false)
    router.push('/analysis')
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
  const isAnonymous = userData.isAnonymous
  const memberSince = userData.createdAt
    ? new Date(
        (userData.createdAt as any).toDate?.() || userData.createdAt
      ).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Unknown'

  // Stats for cards
  const stats = [
    {
      label: 'Saved Products',
      count: userData.savedProducts?.length || 0,
      icon: Bookmark,
      tab: 'saved',
    },
    {
      label: 'Liked Products',
      count: userData.likedProducts?.length || 0,
      icon: Heart,
      tab: 'liked',
    },
    {
      label: 'Disliked Products',
      count: userData.dislikedProducts?.length || 0,
      icon: ThumbsDown,
      tab: 'disliked',
    },
  ]

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Profile Header */}
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            {userData.displayName || userData.email || 'Anonymous User'}
          </p>
          <p className="text-muted-foreground text-sm">
            Member since {memberSince}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card
                key={stat.tab}
                className="cursor-pointer transition-shadow hover:shadow-lg"
                onClick={() => router.push(`/products/saved?tab=${stat.tab}`)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.label}
                  </CardTitle>
                  <Icon className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.count}</div>
                  <p className="text-muted-foreground text-xs">
                    Click to view all
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Follicle ID Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Follicle ID</CardTitle>
            <CardDescription>
              Connects you with others who have similar hair
            </CardDescription>
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

        {/* Hair Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Hair Analysis</CardTitle>
            <CardDescription>Your complete hair profile</CardDescription>
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
              {hair?.budget !== undefined && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    Monthly Budget
                  </p>
                  <p className="text-lg font-semibold">${hair.budget}</p>
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

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="bg-primary w-full text-white"
              onClick={() => setShowRetakeDialog(true)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake Hair Analysis
            </Button>

            {isAnonymous ? (
              <Button
                className="w-full"
                onClick={() => setShowAuthDialog(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account to Save Progress
              </Button>
            ) : (
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Auth Dialog */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        defaultTab="signup"
      />

      {/* Retake Analysis Warning */}
      <Dialog open={showRetakeDialog} onOpenChange={setShowRetakeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚠️ Retake Hair Analysis?</DialogTitle>
            <DialogDescription>
              Your Follicle ID may change based on new answers.
            </DialogDescription>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Your saved products, likes, and dislikes will be kept, but product
            recommendations will be recalculated based on your new hair profile.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRetakeDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRetakeAnalysis}>Retake Analysis →</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
