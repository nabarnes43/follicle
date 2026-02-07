'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { useAuth } from '@/contexts/auth'
import AuthDialog from '@/components/auth/AuthDialog'
import { User } from '@/types/user'
import { decodeFollicleIdForDisplay } from '@/functions/src/shared/follicleId'

interface AnalysisResultsClientProps {
  follicleId: string
  initialUserData: User
}

export function AnalysisResultsClient({
  follicleId,
  initialUserData,
}: AnalysisResultsClientProps) {
  const router = useRouter()
  const { user: authUser } = useAuth()

  // UI state
  const [copied, setCopied] = useState(false)
  const [userData, setUserData] = useState<User | null>(initialUserData)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authTab, setAuthTab] = useState<'signup' | 'signin'>('signup')
  // Anonymous account linking
  const [previousUserId, setPreviousUserId] = useState<string | null>(null)
  const hasToastRun = useRef(false)

  // Track anonymous user ID before they sign in
  useEffect(() => {
    if (authUser?.isAnonymous) {
      setPreviousUserId(authUser.uid)
    }
  }, [authUser])

  // Link anonymous results after sign in/signup
  useEffect(() => {
    async function handleAccountLink() {
      if (!authUser || authUser.isAnonymous || !previousUserId) return
      if (previousUserId === authUser.uid) return

      console.log('🔗 Linking anonymous results...')
      try {
        await linkAnonymousResults(
          authUser.uid,
          authUser.email || '',
          previousUserId
        )
        const data = await getUser(authUser.uid)
        setUserData(data)
        setPreviousUserId(null)
      } catch (error) {
        console.error('Failed to link anonymous results:', error)
      }
    }
    handleAccountLink()
  }, [authUser, previousUserId])

  // Copy follicleId to clipboard
  const copyFollicleId = () => {
    if (follicleId) {
      navigator.clipboard.writeText(follicleId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Decode follicleId for display
  const decoded = follicleId ? decodeFollicleIdForDisplay(follicleId) : null
  const follicleIdDescription = decoded
    ? Object.values(decoded).join(' • ')
    : 'No analysis completed'

  const hair = userData?.hairAnalysis
  const isAnonymous = authUser?.isAnonymous

  // Main results UI
  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Your Hair Profile</h1>
          <p className="text-muted-foreground text-xl">
            Your analysis is complete. Personalized scores are being calculated
            in the background.
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

        {/* Save Results (Anonymous Users) */}
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

        {/* CTA Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            onClick={() => router.push('/products')}
            onMouseEnter={() => router.prefetch('/products')}
          >
            Browse Products
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push('/routines/public')}
          >
            Browse Routines
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
