'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import { getUser } from '@/lib/analysis/analysis'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { User } from '@/types/user'
import { Sparkles } from 'lucide-react'

interface RequireAuthProps {
  children: (userData: User) => React.ReactNode
  requireFollicleId?: boolean
  redirectTo?: string
}

export function RequireAuth({
  children,
  requireFollicleId = false,
  redirectTo = '/analysis',
}: RequireAuthProps) {
  const { user: authUser, loading: authLoading } = useAuth() // Get loading state from context
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<User | null>(null)
  const [needsAnalysis, setNeedsAnalysis] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      // Wait for auth to finish loading
      if (authLoading) {
        console.log('⏳ Auth still loading...')
        return
      }

      console.log('🔐 RequireAuth - Checking auth...', {
        authUser: authUser?.uid,
        requireFollicleId,
      })

      // Not logged in - redirect
      if (!authUser) {
        console.log('❌ No auth user - redirecting to', redirectTo)
        setLoading(false)
        router.push(redirectTo)
        return
      }

      // Need to check follicleId
      if (requireFollicleId) {
        try {
          const data = await getUser(authUser.uid)
          console.log('👤 User data:', {
            userId: data?.userId,
            follicleId: data?.follicleId,
          })

          // No follicleId - show analysis prompt
          if (!data?.follicleId) {
            console.log('⚠️ No follicleId - showing analysis prompt')
            setNeedsAnalysis(true)
            setLoading(false)
            return
          }

          console.log('✅ Has follicleId - allowing access')
          setUserData(data)
        } catch (error) {
          console.error('Failed to load user:', error)
          router.push(redirectTo)
          return
        }
      }

      setLoading(false)
    }

    checkAuth()
  }, [authUser, authLoading, requireFollicleId, redirectTo, router])

  console.log('🎨 RequireAuth - Render state:', {
    authLoading,
    loading,
    needsAnalysis,
    hasUserData: !!userData,
  })

  // Show loading spinner while auth or data loads
  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  // Show "Complete Analysis" page
  if (needsAnalysis) {
    console.log('🎯 Rendering analysis prompt page')
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Sparkles className="text-primary h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">
              Complete Your Hair Analysis
            </CardTitle>
            <CardDescription>
              You need to complete your hair analysis before you can access this
              page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center text-sm">
              Our 10-minute analysis will evaluate your unique hair
              characteristics and provide personalized product recommendations.
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push('/analysis')}
            >
              Take Hair Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not authenticated - don't render anything (redirecting)
  if (!authUser || (requireFollicleId && !userData)) {
    return null
  }

  // Render children with userData
  return <>{children(userData!)}</>
}
