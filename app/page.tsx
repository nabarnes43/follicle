// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/contexts/auth'
import AuthDialog from '@/components/auth/AuthDialog'
import SignOutButton from '@/components/auth/SignOutButton'
import { getUser } from '@/lib/firebase/analysis'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authTab, setAuthTab] = useState<'signup' | 'signin'>('signup')
  const [hasCompletedAnalysis, setHasCompletedAnalysis] = useState(false)
  const [checkingAnalysis, setCheckingAnalysis] = useState(true)

  // Check if user has completed analysis
  useEffect(() => {
    async function checkAnalysis() {
      console.log('1. Checking analysis status for user:', user)

      if (!user || user.isAnonymous) {
        console.log('2. User is anonymous or null, skipping check')
        setCheckingAnalysis(false)
        return
      }

      console.log('3. Fetching user data for:', user.uid)
      try {
        const userData = await getUser(user.uid)
        console.log('4. User data:', userData)
        console.log('5. Has follicleId?', !!userData?.follicleId)
        setHasCompletedAnalysis(!!userData?.follicleId)
      } catch (error) {
        console.error('Failed to check analysis status:', error)
      } finally {
        setCheckingAnalysis(false)
      }
    }

    checkAnalysis()
  }, [user])
  if (loading || checkingAnalysis) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  const startAnalysis = () => {
    router.push('/analysis')
  }

  const viewResults = () => {
    router.push('/analysis/results')
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          {/* Show user status if logged in */}
          {user && !user.isAnonymous && (
            <div className="bg-muted mb-4 rounded-lg p-3">
              <p className="text-sm font-medium">
                Welcome back, {user.email || user.displayName}!
              </p>
            </div>
          )}

          <CardTitle className="mb-4 text-4xl">
            {hasCompletedAnalysis
              ? 'Your Hair Care Profile'
              : 'Discover Your Perfect Hair Care Routine'}
          </CardTitle>
          <CardDescription className="text-lg">
            {hasCompletedAnalysis
              ? 'View your results or retake the analysis to update your profile'
              : 'Take our 10-minute hair analysis to get your unique Follicle ID and personalized product recommendations.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Main CTA */}
          {hasCompletedAnalysis ? (
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full py-6 text-lg"
                onClick={viewResults}
              >
                View My Results
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full py-6 text-lg"
                onClick={startAnalysis}
              >
                Retake Analysis
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              className="w-full py-6 text-lg"
              onClick={startAnalysis}
            >
              Take Hair Analysis
            </Button>
          )}

          {/* Auth section */}
          {user && !user.isAnonymous ? (
            // Logged in user
            <div className="space-y-3 text-center">
              <p className="text-muted-foreground text-sm">
                Want to start fresh?
              </p>
              <SignOutButton />
            </div>
          ) : (
            // Anonymous or no user
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-muted-foreground mb-3 text-sm">
                  Create an account to save your results
                </p>
                <Button
                  variant="default"
                  onClick={() => {
                    setAuthTab('signup')
                    setShowAuthDialog(true)
                  }}
                >
                  Create Account
                </Button>
              </div>

              <div className="text-center">
                <p className="text-muted-foreground mb-2 text-sm">
                  Already have an account?
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAuthTab('signin')
                    setShowAuthDialog(true)
                  }}
                >
                  Sign In
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auth Dialog */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        defaultTab={authTab}
      />
    </div>
  )
}
