// app/quiz/results/page.tsx
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
import { getUser } from '@/lib/firebase/quiz'
import { getFollicleIdDescription } from '@/lib/quiz/follicleId'
import { useAuth } from '@/contexts/auth'
import { User } from '@/types/user'

export default function QuizResultsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const follicleId = searchParams.get('follicleId')
  const { user: authUser } = useAuth()
  const [copied, setCopied] = useState(false)
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      if (!authUser?.uid) return
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
        <div className="text-center">
          <Button size="lg" onClick={() => router.push('/products')}>
            Discover Products For Your Hair
          </Button>
        </div>
      </div>
    </div>
  )
}
