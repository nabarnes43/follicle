// app/analysis/results/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Copy, Check } from 'lucide-react'
import { getUser, linkAnonymousResults } from '@/lib/analysis/analysis'
import { getFollicleIdDescription } from '@/lib/analysis/follicleId'
import { useAuth } from '@/contexts/auth'
import AuthDialog from '@/components/auth/AuthDialog'
import { User } from '@/types/user'

export default function AnalysisResultsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const follicleId = searchParams.get('follicleId')
  const { user: authUser } = useAuth()
  const [copied, setCopied] = useState(false)
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authTab, setAuthTab] = useState<'signup' | 'signin'>('signup')
  const [previousUserId, setPreviousUserId] = useState<string | null>(null)

  // Track when user was anonymous (before they sign in)
  useEffect(() => {
    if (authUser?.isAnonymous) {
      setPreviousUserId(authUser.uid)
    }
  }, [authUser])

  useEffect(() => {
    // If no follicleId in URL but user is logged in, get it from their profile
    if (!follicleId && userData?.follicleId) {
      router.replace(`/analysis/results?follicleId=${userData.follicleId}`)
    }
  }, [follicleId, userData, router])

  // Load user data
  useEffect(() => {
    async function loadUser() {
      if (!authUser?.uid) {
        setLoading(false)
        return
      }

      try {
        const data = await getUser(authUser.uid)
        setUserData(data)
      } catch (error) {
        console.error('Failed to load user:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [authUser])
  
  // Handle linking anonymous results after sign in/signup
  useEffect(() => {
    async function handleAccountLink() {
      if (!authUser || authUser.isAnonymous || !previousUserId) return

      // User just signed in/up, and we have their previous anonymous ID
      if (previousUserId !== authUser.uid) {
        console.log('🔗 Linking anonymous results...')
        try {
          await linkAnonymousResults(
            authUser.uid,
            authUser.email || '',
            previousUserId
          )

          // Reload user data to show updated info
          const data = await getUser(authUser.uid)
          setUserData(data)

          setPreviousUserId(null) // Clear so we don't link again
        } catch (error) {
          console.error('Failed to link anonymous results:', error)
        }
      }
    }
    handleAccountLink()
  }, [authUser, previousUserId])

  const copyFollicleId = () => {
    if (follicleId) {
      navigator.clipboard.writeText(follicleId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading your results...</p>
      </div>
    )
  }

  const hair = userData?.hairAnalysis
  const isAnonymous = authUser?.isAnonymous

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Your Hair Profile</h1>
          <p className="text-muted-foreground text-xl">
            Your unique hair identity
          </p>
        </div>

        {/* Follicle ID */}
        <Card className="mb-8">
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
                  {follicleId}
                </p>
                <p className="text-muted-foreground text-sm">
                  {follicleId && getFollicleIdDescription(follicleId)}
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

        {/* Save Results Prompt for Anonymous Users */}
        {isAnonymous && (
          <Card className="border-primary mb-8">
            <CardHeader>
              <CardTitle>Save Your Results</CardTitle>
              <CardDescription>
                Create an account to save your hair profile and get personalized
                recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  setAuthTab('signup')
                  setShowAuthDialog(true)
                }}
              >
                Create Account
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setAuthTab('signin')
                  setShowAuthDialog(true)
                }}
              >
                Already Have an Account? Sign In
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Success message after linking */}
        {!isAnonymous && authUser && (
          <Card className="bg-primary/5 border-primary mb-8">
            <CardContent className="pt-6">
              <p className="text-center font-medium">
                Your results have been saved to your account!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Hair Analysis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Hair Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Hair Type</p>
                <p className="text-lg font-semibold capitalize">
                  {hair?.hairType}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Porosity</p>
                <p className="text-lg font-semibold capitalize">
                  {hair?.porosity}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Density</p>
                <p className="text-lg font-semibold capitalize">
                  {hair?.density}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Thickness</p>
                <p className="text-lg font-semibold capitalize">
                  {hair?.thickness}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Damage</p>
                <p className="text-lg font-semibold capitalize">
                  {hair?.damage}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={() => router.push('/recommendations')}>
            View Product Recommendations
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.push('/')}>
            Back to Home
          </Button>
        </div>
      </div>

      {/* Auth Dialog */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        defaultTab={authTab}
      />
    </div>
  )
}
